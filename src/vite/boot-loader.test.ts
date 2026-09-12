import { afterEach, describe, expect, it, vi } from "vitest"

import { vigletBootLoader, type VigletBootLoaderOptions } from "./boot-loader"

// VDS67 — every option is interpolated into CSS or HTML, and four behaviours
// were silent: a title holding "$&" lost text to replacement-pattern expansion,
// a colour the hex parser could not read rendered one accent in the gradients
// and a hardcoded blue in the tints, a prefix that was not an identifier put its
// own rules in the stylesheet, and a page with no injection point built fine
// with no loader in it.

const BASE: VigletBootLoaderOptions = {
  title: "Viglet Turing ES",
  subtitle: "Enterprise Search Intelligence",
  color: "#4169E1",
}

const HTML = `<html><head></head><body><div id="root"><!--viglet-boot-loader--></div></body></html>`

interface Transformed {
  html: string
  tags: { tag: string; children?: string }[]
}

function transform(options: Partial<VigletBootLoaderOptions>, html = HTML): Transformed {
  const plugin = vigletBootLoader({ ...BASE, ...options })
  const hook = plugin.transformIndexHtml as (h: string) => Transformed
  return hook(html)
}

const styleOf = (t: Transformed) =>
  t.tags.find((tag) => tag.tag === "style")?.children ?? ""

const scriptOf = (t: Transformed) =>
  t.tags.find((tag) => tag.tag === "script")?.children ?? ""

afterEach(() => {
  vi.restoreAllMocks()
})

describe("vigletBootLoader", () => {
  it("puts the markup where the placeholder was", () => {
    const { html } = transform({})

    expect(html).toContain(`id="viglet-boot-loader"`)
    expect(html).not.toContain("<!--viglet-boot-loader-->")
  })

  it("falls back to just inside the root div", () => {
    const { html } = transform({}, `<html><body><div id="root"></div></body></html>`)

    expect(html).toContain(`id="viglet-boot-loader"`)
  })

  it("ships a style and a script into the head", () => {
    const { tags } = transform({})

    expect(tags.map((t) => t.tag)).toEqual(["style", "script"])
  })

  describe("a title holding replacement patterns", () => {
    it("keeps every word of the title", () => {
      // Was "Cost <!--viglet-boot-loader--> Billing": markup went in as a
      // replacement string, so "$&" expanded to the placeholder it matched.
      const { html } = transform({ title: "Cost $& Billing" })

      expect(html).toContain("Cost $&amp; Billing")
      expect(html).not.toContain("<!--viglet-boot-loader-->")
    })

    it("keeps a dollar-digit pair, which names a capture group", () => {
      const { html } = transform({ title: "Plan $1 Billing" })

      expect(html).toContain("Plan $1 Billing")
    })

    it("keeps the title intact on the root-div path too", () => {
      const { html } = transform(
        { title: "Cost $& Billing" },
        `<html><body><div id="root"></div></body></html>`,
      )

      expect(html).toContain("Cost $&amp; Billing")
    })

    it("still escapes markup in a title", () => {
      const { html } = transform({ title: `<script>x</script>` })

      expect(html).toContain("&lt;script&gt;")
      expect(html).not.toContain("<script>x</script>")
    })
  })

  describe("a colour it cannot read both ways", () => {
    it("refuses a named CSS colour rather than rendering two accents", () => {
      // royalblue is valid CSS: it reached the gradients and was replaced by a
      // hardcoded 37, 99, 235 in every rgba tint.
      expect(() => transform({ color: "royalblue" })).toThrow(/must be a hex colour/)
    })

    it("names the option it refused", () => {
      expect(() => transform({ color: "#4169E1", colorDark: "rgb(0,0,0)" })).toThrow(
        /colorDark/,
      )
    })

    it("takes both hex lengths", () => {
      expect(styleOf(transform({ color: "#41E" }))).toContain("68, 17, 238")
      expect(styleOf(transform({ color: "#4169E1" }))).toContain("65, 105, 225")
    })

    it("derives the tints from the colour it was given", () => {
      const style = styleOf(transform({ color: "#4169E1" }))

      expect(style).toContain("#4169E1")
      expect(style).not.toContain("37, 99, 235")
    })
  })

  describe("a prefix that is not an identifier", () => {
    it("refuses one carrying CSS syntax", () => {
      expect(() => transform({ prefix: "x{} body{display:none} .y" })).toThrow(/prefix/)
    })

    it.each(["", "1turing", "has space", "has.dot"])("refuses %o", (prefix) => {
      expect(() => transform({ prefix })).toThrow(/prefix/)
    })

    it("takes an ordinary product prefix", () => {
      const style = styleOf(transform({ prefix: "turing-es" }))

      expect(style).toContain(".turing-es-boot-ring")
      expect(style).not.toContain("viglet-boot-ring")
    })
  })

  describe("a page with nowhere to inject", () => {
    it("warns instead of silently shipping no loader", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

      transform({}, `<html><body><div id="app"></div></body></html>`)

      expect(warn).toHaveBeenCalledOnce()
      expect(warn.mock.calls[0][0]).toMatch(/no injection point/)
    })

    it("leaves the html alone", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {})
      const original = `<html><body><div id="app"></div></body></html>`

      expect(transform({}, original).html).toBe(original)
    })

    it("says nothing when it did inject", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

      transform({})

      expect(warn).not.toHaveBeenCalled()
    })
  })

  // VDS96 — the loader runs before any bundle, so it cannot ask i18next for a
  // word. Its status region was named `Loading <title>` in the HTML itself, and
  // a screen reader opening a Portuguese product heard English before the app it
  // was waiting for could say anything. The VDS93 literals gate reads JSX and
  // never saw it: this is a template string in a .ts file.
  describe("the word the loader says first", () => {
    const labelOf = (html: string) =>
      /<div id="viglet-boot-loader"[^>]*aria-label="([^"]*)"/.exec(html)?.[1]

    it("keeps the English default for a product that supplies nothing", () => {
      // Four consumers predate the option. Defaulting is the difference between
      // an upgrade and silently relabelling their loaders.
      expect(labelOf(transform({}).html)).toBe("Loading Viglet Turing ES")
    })

    it("says the product's own phrase when it supplies one", () => {
      const { html } = transform({ loadingLabel: "Carregando o Viglet Turing ES" })

      expect(labelOf(html)).toBe("Carregando o Viglet Turing ES")
      expect(html).not.toContain("Loading Viglet Turing ES")
    })

    it("escapes it, like every other option that reaches the HTML", () => {
      const { html } = transform({ loadingLabel: `Carregando <b>"Turing"</b>` })

      expect(html).not.toContain("<b>")
      expect(labelOf(html)).toContain("&lt;b&gt;")
    })

    it("emits no language picker when the product gave no map", () => {
      expect(scriptOf(transform({}))).not.toContain("navigator.language")
    })

    it("picks by language tag, then by its primary subtag", () => {
      const script = scriptOf(
        transform({ loadingLabels: { "pt-BR": "Carregando", pt: "A carregar", en: "Loading" } }),
      )

      expect(script).toContain("navigator.language")
      expect(script).toContain(`"pt-BR":"Carregando"`)
      expect(script).toContain(`tag.split("-")[0]`)
      // It sets the attribute rather than rewriting the region.
      expect(script).toContain(`setAttribute("aria-label", label)`)
    })

    it("still writes a build-time label beside the map, for scripting off", () => {
      // The map only improves on the HTML; a reader without scripting keeps
      // whatever the build wrote, so that must never be left empty.
      const { html } = transform({
        loadingLabel: "Carregando o Turing",
        loadingLabels: { en: "Loading Turing" },
      })

      expect(labelOf(html)).toBe("Carregando o Turing")
    })
  })

  describe("the injected script", () => {
    it("reads the storage key it was given", () => {
      const { tags } = transform({ storageKey: "turing-theme" })
      const script = tags.find((t) => t.tag === "script")?.children ?? ""

      expect(script).toContain(`"turing-theme"`)
    })

    it("guards the test flag behind the loading parameter", () => {
      const { tags } = transform({ testFlag: "__TURING_LOADING__" })
      const script = tags.find((t) => t.tag === "script")?.children ?? ""

      expect(script).toContain(`"__TURING_LOADING__"`)
      expect(script).toContain(`has("loading")`)
    })
  })
})
