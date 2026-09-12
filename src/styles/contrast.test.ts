import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

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
 * **Arithmetic, not a browser.** jsdom does not compute `oklch()`, so asking it
 * what colour a label ended up would be asserting on the stylesheet's own text.
 * The conversion is Ottosson's OKLab matrix, which lands on linear sRGB — what
 * WCAG's relative luminance wants — so nothing is gamma-encoded only to be
 * decoded again.
 *
 * **A value it cannot read is a failure, not a skip.** A `color-mix` or a
 * dangling `var()` would otherwise shrink what this covers every time the preset
 * grows, and a pair nobody measures is a pair nobody is keeping.
 */

/** WCAG 2 AA for body text. AAA's 7:1 rules out most of a neutral palette's greys. */
const AA_TEXT = 4.5

/** The declarations under one selector, comments removed first. */
function tokensUnder(css: string, selector: string): Map<string, string> {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const found = new Map<string, string>()
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  for (const block of bare.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))) {
    for (const declaration of (block[1] ?? "").split(";")) {
      const at = declaration.indexOf(":")
      if (at === -1) continue
      const name = declaration.slice(0, at).trim()
      if (name.startsWith("--")) found.set(name, declaration.slice(at + 1).trim())
    }
  }
  return found
}

/** Follow `var(--x)` to the literal it names, a few hops at most. */
function resolveToken(tokens: Map<string, string>, value: string, depth = 5): string {
  const points = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value.trim())
  if (points === null || depth === 0) return value
  const next = tokens.get(points[1] ?? "")
  return next === undefined ? value : resolveToken(tokens, next, depth - 1)
}

/** Relative luminance of an `oklch(...)` literal, or null where it is not one. */
function luminance(value: string): number | null {
  const found = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?\s*(?:\/.*)?\)$/i.exec(value.trim())
  if (found === null) return null
  const l = Number(found[1]) / (found[2] === "%" ? 100 : 1)
  const c = Number(found[3])
  const h = (Number(found[4]) * Math.PI) / 180
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  const long = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (x: number) => Math.min(1, Math.max(0, x))

  const r = clamp(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short)
  const g = clamp(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short)
  const bl = clamp(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short)
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl
}

function ratio(front: number, behind: number): number {
  return (Math.max(front, behind) + 0.05) / (Math.min(front, behind) + 0.05)
}

const preset = readFileSync(presetPath, "utf8")
const light = tokensUnder(preset, ":root")
/** Dark overrides what it redeclares and inherits the rest, as the cascade does. */
const dark = new Map([...light, ...tokensUnder(preset, '[data-theme="dark"]')])

/**
 * Every `--vg-X` that has a `--vg-X-foreground`, plus the page itself.
 *
 * VDS99 — the page was the one pair nothing measured. `--vg-foreground` is body
 * text, and stripping the suffix leaves `--vg`, which no preset declares, so the
 * filter below dropped it in both grounds: the most-rendered colour combination
 * in the package went unchecked while the gate reported a clean sweep. Its
 * surface is `--vg-background`, a name the pattern cannot derive and has to be
 * told.
 */
function pairs(tokens: Map<string, string>): [surface: string, foreground: string][] {
  const derived = [...tokens.keys()]
    .filter((name) => name.startsWith("--vg-") && name.endsWith("-foreground"))
    .map((foreground) => [foreground.slice(0, -"-foreground".length), foreground] as [string, string])
    .filter(([surface]) => tokens.has(surface))

  const page: [string, string][] =
    tokens.has("--vg-background") && tokens.has("--vg-foreground")
      ? [["--vg-background", "--vg-foreground"]]
      : []

  return [...page, ...derived]
}

describe.each([
  ["light", light],
  ["dark", dark],
] as const)("VDS92: every named token pair on the %s ground", (_ground, tokens) => {
  it("finds the pairs, which is what makes the check below mean anything", () => {
    // The control: a parser that matched nothing would pass the ratio check over
    // no pairs at all.
    expect(pairs(tokens).map(([surface]) => surface)).toEqual(
      expect.arrayContaining(["--vg-background", "--vg-card", "--vg-muted", "--vg-popover", "--vg-secondary"]),
    )
  })

  it.each(pairs(tokens))("keeps %s legible under its foreground", (surface, foreground) => {
    const behind = luminance(resolveToken(tokens, tokens.get(surface) ?? ""))
    const front = luminance(resolveToken(tokens, tokens.get(foreground) ?? ""))

    expect(behind, `${surface} does not resolve to an oklch() literal`).not.toBeNull()
    expect(front, `${foreground} does not resolve to an oklch() literal`).not.toBeNull()
    // Measured off the asserted values, not off a fallback: `?? 0` stood here,
    // so a token that stopped resolving was measured as black and could pass.
    const measured = ratio(front!, behind!)
    expect(measured, `${foreground} on ${surface} is ${measured.toFixed(2)}:1`).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it("keeps muted text legible on the page, which is where it most often sits", () => {
    // Not a named pair, and the placement a muted label is usually in: a caption
    // on the ground, not on a muted panel.
    const ground = luminance(resolveToken(tokens, tokens.get("--vg-background") ?? ""))
    const muted = luminance(resolveToken(tokens, tokens.get("--vg-muted-foreground") ?? ""))

    // VDS99 — `ratio(muted ?? 0, ground ?? 1)` measured an unresolvable ground as
    // white, so on the light ground this case passed having measured nothing at
    // all, against the rule the file states two lines up.
    expect(ground, "--vg-background does not resolve to an oklch() literal").not.toBeNull()
    expect(muted, "--vg-muted-foreground does not resolve to an oklch() literal").not.toBeNull()

    const measured = ratio(muted!, ground!)
    expect(
      measured,
      `--vg-muted-foreground on --vg-background is ${measured.toFixed(2)}:1`,
    ).toBeGreaterThanOrEqual(AA_TEXT)
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
  const canvas = readFileSync(
    resolve(srcDir, "..", "docs", "reference", "grounds.dc.html"),
    "utf8",
  )

  /** Linear luminance to the sRGB byte a browser paints. */
  const byte = (linear: number) => {
    const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055
    return Math.round(encoded * 255)
  }

  const mutedLinear = luminance(resolveToken(light, light.get("--vg-muted-foreground") ?? ""))
  const groundLinear = luminance(resolveToken(light, light.get("--vg-background") ?? ""))

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
