// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { groundTokens, parseColour } from "../../scripts/lib/contrast.mjs"
import { OG_CARD_TONES, ogCardSvg, renderOgCard } from "./og-card"

/** VDS215 — the social card, drawn from a tone's tokens. */

const preset = readFileSync(resolve(import.meta.dirname, "..", "styles", "preset.css"), "utf8")

describe("the card's palette is the tone's dark ground", () => {
  /** Two colours that round to the same sRGB byte are the same colour here. */
  const near = (a: string, b: string, tokens: Map<string, string>) => {
    const x = parseColour(a, tokens)!
    const y = parseColour(b, tokens)!
    return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b) < 0.005
  }

  it.each(Object.keys(OG_CARD_TONES) as (keyof typeof OG_CARD_TONES)[])("%s", (tone) => {
    const { tokens } = groundTokens([{ name: "preset.css", css: preset }], "dark", tone)
    const palette = OG_CARD_TONES[tone]
    expect(near(palette.background, tokens.get("--vg-background")!, tokens), "background").toBe(true)
    expect(near(palette.foreground, tokens.get("--vg-foreground")!, tokens), "foreground").toBe(true)
    expect(near(palette.muted, tokens.get("--vg-muted-foreground")!, tokens), "muted").toBe(true)
    expect(near(palette.brand, tokens.get("--vg-brand")!, tokens), "brand").toBe(true)
    const gradient = tokens.get("--vg-gradient")!.toLowerCase()
    for (const stop of palette.gradient) expect(gradient).toContain(stop)
  })
})

describe("ogCardSvg", () => {
  const svg = ogCardSvg({
    eyebrow: "Open source",
    title: ["Your usage,"],
    titleAccent: "always in the tray.",
    line: "Burn rate & cost <per session>",
    tone: "warm",
  })

  it("is a 1200 by 630 card in the tone's ground", () => {
    expect(svg).toContain('width="1200" height="630"')
    expect(svg).toContain(`fill="${OG_CARD_TONES.warm.background}"`)
    expect(svg).toContain(`stop-color="${OG_CARD_TONES.warm.gradient[1]}"`)
  })

  it("escapes the copy", () => {
    expect(svg).toContain("Burn rate &amp; cost &lt;per session&gt;")
    expect(svg).toContain(">OPEN SOURCE<")
  })

  it("draws the accent line in the gradient and the rest in the foreground", () => {
    expect(svg).toMatch(/fill="url\(#vg-og-grad\)"[^>]*>always in the tray\.</)
    expect(svg).toMatch(new RegExp(`fill="${OG_CARD_TONES.warm.foreground}"[^>]*>Your usage,<`))
  })

  it("takes an accent for the highlight", () => {
    expect(ogCardSvg({ title: "T", eyebrow: "E", accent: "#2166b8" })).toMatch(/fill="#2166b8"[^>]*>E</)
  })

  it("places a mark by height and refuses one it cannot size", () => {
    const mark = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 20"><rect width="10" height="20"/></svg>'
    const placed = ogCardSvg({ title: "T", mark })
    expect(placed).toContain('scale(6.000000)"><rect width="10" height="20"/></g>')
    expect(() => ogCardSvg({ title: "T", mark: "<svg><rect/></svg>" })).toThrow("no viewBox")
  })
})

describe("renderOgCard", () => {
  it("writes a 1200 by 630 PNG", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vds-og-"))
    try {
      const out = join(dir, "og.png")
      const result = await renderOgCard({ svg: ogCardSvg({ title: "Card", line: "Line" }), out })
      const png = readFileSync(out)
      expect(png.subarray(1, 4).toString("ascii")).toBe("PNG")
      expect(png.readUInt32BE(16)).toBe(1200)
      expect(png.readUInt32BE(20)).toBe(630)
      expect(result).toEqual({ width: 1200, height: 630, bytes: png.length })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it("refuses a card of another size", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vds-og-"))
    try {
      const square = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"/>'
      await expect(renderOgCard({ svg: square, out: join(dir, "og.png") })).rejects.toThrow("expected 1200x630, got 1200x1200")
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
