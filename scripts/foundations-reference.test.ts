import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { HEIGHT, OUTPUT, TYPE_STEPS, WIDTH, foundationsReference, tailwindTheme, typeScale } from "./foundations-reference.mjs"
import { tokensJson } from "./lib/tokens-json.mjs"

// VDS239 — the foundation cards are generated, so what has to hold is that the
// committed page is the generator's current output and that every number on it
// is the one tokens.json and Tailwind state.

const root = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
const page = readFileSync(OUTPUT, "utf8")

describe("docs/reference/foundations.dc.html", () => {
  it("is what the generator draws from today's tokens", () => {
    expect(page, "the page is stale: run node scripts/foundations-reference.mjs").toBe(
      foundationsReference(preset, tailwindTheme()),
    )
  })

  it("prints the type steps Tailwind defines, at their px", () => {
    const printed = [...page.matchAll(/data-step="(\w+)" data-size="([\d.]+)"/g)].map((m) => [m[1], Number(m[2])])
    expect(printed).toEqual(typeScale(tailwindTheme()).map((s) => [s.step, s.size]))
    expect(printed.map(([step]) => step)).toEqual(TYPE_STEPS.map((s) => s.step))
    expect(Object.fromEntries(printed)).toMatchObject({ xs: 12, sm: 14, "2xl": 24 })
  })

  it("prints the radii and control heights tokens.json states", () => {
    const { dimension } = tokensJson(preset)
    for (const [, token, px] of page.matchAll(/data-token="--vg-([\w-]+)" data-px="(\d+)"/g)) {
      expect(Number(px), token).toBe(dimension[token].$extensions["com.viglet"].reactNative)
    }
    expect(page).toContain('data-token="--vg-control-form" data-px="36"')
    expect(page).toContain('data-token="--vg-radius-panel" data-px="10"')
  })

  it("is placed on the canvas at the size its root draws", () => {
    const canvas = JSON.parse(readFileSync(join(root, "docs", "reference", "canvas.json"), "utf8")) as {
      pages: { id: string }[]
      artboards: { file: string; w: number; h: number; page: string }[]
    }
    const board = canvas.artboards.find((a) => a.file === "foundations.dc.html")
    expect(board).toMatchObject({ w: WIDTH, h: HEIGHT })
    expect(canvas.pages.map((p) => p.id)).toContain(board!.page)
    expect(page).toContain(`width:${WIDTH}px;height:${HEIGHT}px`)
  })

  it("is listed in the reference's table", () => {
    expect(readFileSync(join(root, "docs", "reference", "README.md"), "utf8")).toContain("`foundations.dc.html`")
  })
})
