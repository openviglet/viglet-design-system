import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const dir = resolve(import.meta.dirname)

/**
 * VDS40: the artwork is the payload.
 *
 * Vite's library mode inlines every asset regardless of `assetsInlineLimit`
 * (verified: setting it to 0 produced a byte-identical build), so a logo an
 * entry can reach is inside that entry. The PNGs these replaced arrived at
 * 1024-2375px square, one of them 1.24 MB, and together they were 96% of the
 * root entry. The marks are now SVG, a few KB each, and this keeps them so:
 * `check-size` catches a big one reaching a bundle; this catches it arriving,
 * which is cheaper and names the file.
 */

/** Comfortably above the largest mark (about 3 KB), and far below any raster. */
const MAX_BYTES = 8 * 1024

const PRODUCTS = ["turing", "shio", "dumont"]

describe("the product logos are small vector marks", () => {
  const logos = readdirSync(dir).filter((f) => f.endsWith(".svg"))

  it("finds the logos at all", () => {
    // Without this the loop below asserts nothing when the directory moves.
    expect(logos).toContain("viglet.svg")
    for (const p of PRODUCTS) {
      expect(logos).toContain(`${p}.svg`)
      expect(logos, `${p} needs a mark for sizes below 56 px`).toContain(`${p}-small.svg`)
    }
  })

  it("ships no raster logo", () => {
    expect(readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/.test(f))).toEqual([])
  })

  for (const name of logos) {
    it(`${name} fits the budget and needs no font`, () => {
      const text = readFileSync(join(dir, name), "utf8")
      expect(text.startsWith("<svg"), `${name} is not an SVG`).toBe(true)
      expect(text, `${name} has no viewBox, so it cannot scale`).toMatch(/viewBox="0 0 \d+ \d+"/)
      expect(text, `${name} draws text, which renders in whatever font the page has`).not.toMatch(
        /<text\b/,
      )
      expect(
        Buffer.byteLength(text),
        `${name} is ${Math.round(Buffer.byteLength(text) / 1024)}KB, and it is inlined into whatever entry reaches it`,
      ).toBeLessThanOrEqual(MAX_BYTES)
    })
  }
})
