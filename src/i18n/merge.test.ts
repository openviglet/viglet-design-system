import { createInstance } from "i18next"
import { describe, expect, it } from "vitest"

import { initVigI18n, registerVigTranslations, vigDesignSystemTranslations } from "./index"

// VDS94 — a product's own namespace no longer costs it the package's strings.
//
// Both doors into i18next merged a namespace at a time, whole. A product that
// ships its own `common` replaced the package's `common` outright, so every key
// this package asks for under it fell back to an English defaultValue — in a
// Portuguese product, silently. VDS51 and VDS93 cannot catch it: they read this
// package's bundles, which are complete either way.
//
// The consoles grew a `common` of their own before this package existed, so the
// namespaces most likely to collide are exactly the ones VDS93 added to.

/** A product bundle that owns one key the package also ships. */
const PRODUCT = {
  pt: {
    common: { save: "Gravar", myOwnKey: "Meu" },
    myApp: { greeting: "Ola" },
  },
}

describe("registerVigTranslations, into a host that already has the namespace", () => {
  function hostWithCommon() {
    const i18n = createInstance()
    i18n.init({
      lng: "pt",
      resources: { pt: { translation: PRODUCT.pt } },
    })
    return i18n
  }

  it("leaves the host's own value alone", () => {
    const i18n = hostWithCommon()
    registerVigTranslations(i18n)

    expect(i18n.t("common.save")).toBe("Gravar")
    expect(i18n.t("myApp.greeting")).toBe("Ola")
  })

  it("fills in the keys the host lacks under that same namespace", () => {
    // The regression. `common.next` used to resolve to the key, because the
    // whole namespace was skipped on the grounds that the host had one.
    const i18n = hostWithCommon()
    registerVigTranslations(i18n)

    expect(i18n.t("common.next")).toBe(vigDesignSystemTranslations.pt.common.next)
    expect(i18n.t("common.cancel")).toBe(vigDesignSystemTranslations.pt.common.cancel)
  })

  it("still brings namespaces the host never had", () => {
    const i18n = hostWithCommon()
    registerVigTranslations(i18n)

    expect(i18n.t("theme.dark")).toBe(vigDesignSystemTranslations.pt.theme.dark)
    expect(i18n.t("assistant.send")).toBe(vigDesignSystemTranslations.pt.assistant.send)
  })

  it("keeps the host's key when called twice", () => {
    // Registering again must not start overwriting: `overwrite: false` is the
    // per-key guard that replaced the per-namespace one.
    const i18n = hostWithCommon()
    registerVigTranslations(i18n)
    registerVigTranslations(i18n)

    expect(i18n.t("common.save")).toBe("Gravar")
    expect(i18n.t("common.next")).toBe(vigDesignSystemTranslations.pt.common.next)
  })
})

describe("initVigI18n, given a product that ships its own common", () => {
  // The real function, on the module singleton it owns. Vitest gives each test
  // file its own module registry, so initialising it here is contained to this
  // file. Read back with `getResource`, which names the language, rather than
  // through `t` — what the detector picks from jsdom is not what is under test.
  const instance = initVigI18n(PRODUCT)
  const resource = (path: string) => instance.getResource("pt", "translation", path)

  it("gives the product's leaf the win", () => {
    expect(resource("common.save")).toBe("Gravar")
  })

  it("keeps every sibling the package shipped under the same namespace", () => {
    // The regression: a spread replaced `common` whole, and these went with it.
    expect(resource("common.next")).toBe(vigDesignSystemTranslations.pt.common.next)
    expect(resource("common.delete")).toBe(vigDesignSystemTranslations.pt.common.delete)
  })

  it("adds the product's own key beside them", () => {
    expect(resource("common.myOwnKey")).toBe("Meu")
  })

  it("carries a namespace only the product has, and one only the package has", () => {
    expect(resource("myApp.greeting")).toBe("Ola")
    expect(resource("assistant.send")).toBe(vigDesignSystemTranslations.pt.assistant.send)
  })
})
