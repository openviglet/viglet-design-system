import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  AA_TEXT,
  groundTokens,
  luminance,
  measurePairs,
  parseColour,
  ratio,
} from "../../scripts/lib/contrast.mjs"

const srcDir = resolve(import.meta.dirname, "..")
const presetPath = join(srcDir, "styles", "preset.css")

/**
 * VDS92 — a token pair is a promise, and this is what keeps it.
 *
 * The preset names its surfaces in pairs, `--vg-X` and `--vg-X-foreground`, and
 * a consumer reaching for both is trusting the second to be legible on the first.
 * One was not: `--vg-muted-foreground` on `--vg-muted` measured 4.34:1 on the
 * light ground, under the 4.5:1 body text needs, in every product. The story
 * gate (VDS6) runs axe, which checks contrast — on what a story renders, and no
 * story put muted text on a muted panel. So the check is on the tokens.
 *
 * VDS137 — the arithmetic is `scripts/lib/contrast.mjs` now, the same module a
 * consumer's `viglet-ds-page-lint --contrast` runs over its own override. It
 * models the cascade (a ground is every `:root` block with the dark blocks laid
 * over it), resolves `var()` and `color-mix(in oklab, …)`, and knows the pairs a
 * name cannot derive: the page, muted text on it, the accented label, and the
 * white label on the accent fill (VDS151 found that one below AA on dark).
 *
 * **A value it cannot read is a failure, not a skip.** A dangling `var()` would
 * otherwise shrink what this covers every time the preset grows, and a pair
 * nobody measures is a pair nobody is keeping.
 */

const preset = readFileSync(presetPath, "utf8")
const sheets = [{ name: "preset.css", css: preset }]

describe.each(["light", "dark"] as const)("VDS92: every named token pair on the %s ground", (ground) => {
  const measured = measurePairs(sheets, ground)

  it("finds the pairs, which is what makes the check below mean anything", () => {
    // The control: a parser that matched nothing would pass the ratio check over
    // no pairs at all. VDS99 added the page; VDS137 the accent family.
    expect(measured.map((p) => `${p.foreground} on ${p.surface}`)).toEqual(
      expect.arrayContaining([
        "--vg-foreground on --vg-background",
        "--vg-muted-foreground on --vg-background",
        "--vg-muted-foreground on --vg-muted",
        "--vg-card-foreground on --vg-card",
        "--vg-popover-foreground on --vg-popover",
        "--vg-primary-foreground on --vg-primary",
        "--vg-accent-fg on --vg-background",
        "white on --vg-accent-fill-from",
        "white on --vg-accent-fill-to",
      ]),
    )
  })

  it.each(measured.map((p) => [`${p.foreground} on ${p.surface}`, p] as const))("keeps %s legible", (_, pair) => {
    expect(pair.unread, `${pair.unread.join(" and ")} does not resolve to an opaque colour`).toEqual([])
    expect(pair.ratio, `${pair.foreground} on ${pair.surface} is ${pair.ratio?.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_TEXT)
  })
})

describe("VDS137: measured where a product re-keys", () => {
  const override = (css: string) => [...sheets, { name: "product.css", css }]
  const pair = (css: string, ground: "light" | "dark", foreground: string, surface: string) =>
    measurePairs(override(css), ground).find((p) => p.foreground === foreground && p.surface === surface)!

  it("reads a product's primary through the base inputs, per ground", () => {
    // One step too light for the white it carries, on light only.
    const css = ":root { --vg-primary-base: oklch(0.62 0 0); --vg-primary-foreground-base: oklch(0.985 0 0); }"
    expect(pair(css, "light", "--vg-primary-foreground", "--vg-primary").ratio).toBeLessThan(AA_TEXT)
    // The dark ground reads its own input, which the product left alone.
    expect(pair(css, "dark", "--vg-primary-foreground", "--vg-primary").ratio).toBeGreaterThanOrEqual(AA_TEXT)
    expect(pair(css, "light", "--vg-primary-foreground", "--vg-primary").origin).toContain("product.css")
  })

  it("keys the dark ground to the light value when a product sets --vg-primary itself", () => {
    // BENTO-AUTHORING §4's warning, measured: the product's :root lands after the
    // preset's dark block and wins on both grounds.
    const css = ":root { --vg-primary: oklch(0.205 0 0); --vg-primary-foreground: oklch(0.985 0 0); }"
    const { tokens } = groundTokens(override(css), "dark")
    expect(tokens.get("--vg-primary")).toBe("oklch(0.205 0 0)")
    expect(pair(css, "dark", "--vg-card-foreground", "--vg-card").ratio).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it("measures a re-keyed accent, an orange too light to be a label", () => {
    const css = ":root { --vg-accent-from: #f97316; --vg-accent-to: #ea580c; --vg-accent-text: rgb(249 115 22); }"
    expect(pair(css, "light", "--vg-accent-fg", "--vg-background").ratio).toBeLessThan(AA_TEXT)
    expect(pair(css, "light", "white", "--vg-accent-fill-from").ratio).toBeLessThan(AA_TEXT)
  })

  it("reads the colour forms a product writes, and refuses the ones it cannot", () => {
    for (const value of ["#000", "#000000", "rgb(0 0 0)", "rgba(0, 0, 0, 1)", "hsl(0 0% 0%)", "oklch(0 0 0)", "black"]) {
      expect(luminance(parseColour(value)), value).toBeCloseTo(0, 5)
    }
    expect(luminance(parseColour("white"))).toBeCloseTo(1, 5)
    expect(luminance(parseColour("color-mix(in oklab, white 50%, transparent)"))).toBeNull()
    expect(parseColour("lab(50% 0 0)")).toBeNull()
  })

  it("names what it cannot read rather than measuring it as black", () => {
    const measured = pair(":root { --vg-background: var(--brand-ground); }", "light", "--vg-foreground", "--vg-background")
    expect(measured.ratio).toBeNull()
    expect(measured.unread).toEqual(["--vg-background"])
  })

  it("lays a product's dark block and a dark media query over its own :root", () => {
    const css = [
      ":root { --vg-accent-text-dark: oklch(0.3 0 0); }",
      "@media (prefers-color-scheme: dark) { :root { --vg-background: oklch(0.1 0 0); } }",
      "@layer base { .dark { --vg-foreground: oklch(0.2 0 0); } }",
    ].join("\n")
    const { tokens } = groundTokens(override(css), "dark")
    expect(tokens.get("--vg-background")).toBe("oklch(0.1 0 0)")
    expect(tokens.get("--vg-foreground")).toBe("oklch(0.2 0 0)")
    expect(groundTokens(override(css), "light").tokens.get("--vg-foreground")).not.toBe("oklch(0.2 0 0)")
  })
})

/**
 * VDS99 — the canvas is a claim about the tokens, so it is held to them.
 *
 * `docs/reference/grounds.dc.html` draws the light ground and labels the muted
 * pair with its ratio. VDS92 changed the token and the canvas kept drawing
 * `#737373` at `4.73:1` — a reference page stating a number the package had
 * stopped shipping, which is worse than one that states none.
 *
 * Read out of the same arithmetic as the gate above rather than typed in, so the
 * next change to the token fails here instead of quietly ageing the page.
 */
describe("VDS99: the grounds canvas draws what the tokens say", () => {
  const canvas = readFileSync(resolve(srcDir, "..", "docs", "reference", "grounds.dc.html"), "utf8")
  const { tokens: light } = groundTokens(sheets, "light")

  /** Linear luminance to the sRGB byte a browser paints. */
  const byte = (linear: number) => {
    const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255)
  }

  const mutedLinear = luminance(parseColour(light.get("--vg-muted-foreground") ?? "", light))
  const groundLinear = luminance(parseColour(light.get("--vg-background") ?? "", light))

  it("draws muted text in the colour the token resolves to", () => {
    expect(mutedLinear).not.toBeNull()
    const hex = byte(mutedLinear!).toString(16).padStart(2, "0")

    expect(canvas, `--vg-muted-foreground paints #${hex}${hex}${hex}`).toContain(`#${hex}${hex}${hex}`)
  })

  it("labels the pair with the ratio the gate measures", () => {
    expect(groundLinear).not.toBeNull()
    const measured = ratio(mutedLinear!, groundLinear!).toFixed(2)

    expect(canvas, `muted on the ground measures ${measured}:1`).toContain(`${measured}:1`)
  })
})
