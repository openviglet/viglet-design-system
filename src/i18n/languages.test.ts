import { describe, expect, it } from "vitest"

import { initVigI18n, vigDesignSystemTranslations } from "./index"

// VDS104 — a product's third language survives the call that sets i18next up.
//
// `initVigI18n` built its resources by walking `["en", "pt"]`, the two languages
// this package ships, so a product passing `es` or `fr` was read at neither key.
// Not a missing translation: a language that did not exist in the instance the
// call returned. Nothing rejected the argument and nothing warned, so the
// product's own screens quietly read the fallback language instead.
//
// That is VDS94's failure one level up. VDS94 merged per key rather than per
// namespace; this merges over the union of the languages either side declares
// rather than over the package's list.
//
// Its own file, not merge.test.ts: `initVigI18n` initialises the module
// singleton, and vitest gives each test file its own module registry. Read back
// with `getResource`, which names the language, rather than through `t` — what
// the detector picks from jsdom is not what is under test.

/** A product whose UI is in a language this package does not ship. */
const PRODUCT = {
  es: {
    common: { save: "Guardar" },
    myApp: { greeting: "Hola" },
  },
}

describe("initVigI18n, given a language the package does not ship", () => {
  const instance = initVigI18n(PRODUCT)
  const resource = (lang: string, path: string) =>
    instance.getResource(lang, "translation", path)

  it("carries that language into the instance at all", () => {
    // The regression: both of these were `undefined`, because `es` was never a
    // key the loop looked at.
    expect(resource("es", "myApp.greeting")).toBe("Hola")
    expect(resource("es", "common.save")).toBe("Guardar")
  })

  it("leaves the package's own two complete beside it", () => {
    expect(resource("en", "common.next")).toBe(vigDesignSystemTranslations.en.common.next)
    expect(resource("pt", "common.next")).toBe(vigDesignSystemTranslations.pt.common.next)
    expect(resource("pt", "assistant.send")).toBe(vigDesignSystemTranslations.pt.assistant.send)
  })

  it("keeps en as the fallback, the one language the package can promise", () => {
    // A product language arriving does not make it complete. The package's
    // strings have no `es`, so what a screen asks for under `assistant` has to
    // come from somewhere — and `en` is the only bundle here that is whole.
    expect(resource("es", "assistant.send")).toBeUndefined()
    // Normalized to a list by `init`, which is why this is not the `"en"` the
    // call site passes.
    expect(instance.options.fallbackLng).toEqual(["en"])
    expect(resource("en", "assistant.send")).toBe(vigDesignSystemTranslations.en.assistant.send)
  })
})
