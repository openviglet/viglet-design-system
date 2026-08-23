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
