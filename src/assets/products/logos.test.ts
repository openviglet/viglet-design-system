import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const dir = resolve(import.meta.dirname)

/**
 * VDS40 — the artwork is the payload.
 *
 * Vite's library mode inlines every asset regardless of `assetsInlineLimit`
 * (verified: setting it to 0 produced a byte-identical build), so a logo an
 * entry can reach is base64 inside that entry — uncacheable, and
 * uncompressible, because base64 of an already-compressed PNG does not gzip.
 *
 * The app switcher draws these at 28 CSS pixels. They arrived at 1024-2375px
 * square, one of them 1.24 MB, and together they were 96% of the root entry.
 * `check-size` catches a big one reaching a bundle; this catches it arriving,
 * which is cheaper and names the file.
 */

/** 9x the 28px the switcher renders — headroom for any display, and no more. */
const MAX_EDGE = 256

/** Comfortably above the largest of the four at that edge, and far below a 1024px one. */
const MAX_BYTES = 96 * 1024

/** PNG dimensions live in the IHDR chunk: two big-endian uint32 at 16 and 20. */
function pngSize(buffer: Buffer) {
  expect(buffer.subarray(1, 4).toString("latin1"), "not a PNG").toBe("PNG")
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

describe("the product logos are the size they are rendered at", () => {
  const logos = readdirSync(dir).filter((f) => f.endsWith(".png"))

  it("finds the logos at all", () => {
    // Without this the loop below asserts nothing when the directory moves.
    expect(logos.length).toBeGreaterThanOrEqual(4)
  })

  for (const name of readdirSync(dir).filter((f) => f.endsWith(".png"))) {
    it(`${name} fits the budget`, () => {
      const buffer = readFileSync(join(dir, name))
      const { width, height } = pngSize(buffer)

      expect(width, `${name} is ${width}px wide; the switcher renders 28`).toBeLessThanOrEqual(
        MAX_EDGE,
      )
      expect(height, `${name} is ${height}px tall; the switcher renders 28`).toBeLessThanOrEqual(
        MAX_EDGE,
      )
      expect(
        buffer.byteLength,
        `${name} is ${Math.round(buffer.byteLength / 1024)}KB, and it is inlined into whatever entry reaches it`,
      ).toBeLessThanOrEqual(MAX_BYTES)
    })
  }
})
