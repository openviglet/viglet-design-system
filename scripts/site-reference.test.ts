import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { AA_TEXT } from "./lib/contrast.mjs"
import { HEIGHT, OUTPUT, WIDTH, measureCell, siteReference } from "./site-reference.mjs"

/**
 * VDS218 — the product-site artboard is generated from the tokens, so what has
 * to hold is that the committed page is the generator's current output, and
 * that the generator marks a failing pair rather than drawing it quietly.
 */

const root = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
const page = readFileSync(OUTPUT, "utf8")

describe("docs/reference/site.dc.html", () => {
  it("is what the generator draws from today's tokens", () => {
    expect(page, "the page is stale: run node scripts/site-reference.mjs").toBe(siteReference(preset))
  })

  it("draws all four combinations of tone and ground", () => {
    const cells = [...page.matchAll(/class="cell" data-tone="(\w+)" data-ground="(\w+)"/g)].map((m) => `${m[1]}/${m[2]}`)
    expect(cells).toEqual(["cool/light", "cool/dark", "warm/light", "warm/dark"])
  })

  it("prints every ratio the measurement makes, body and muted text included", () => {
    const printed = [...page.matchAll(/data-ratio="([\d.]+)"/g)].map((m) => m[1])
    const measured = ["cool", "warm"].flatMap((tone) =>
      ["light", "dark"].flatMap((ground) => {
        const cell = measureCell(preset, tone, ground)
        return [...cell.accents.map((a) => a.ratio), ...cell.ratios].map((r) => r.value.toFixed(2))
      }),
    )
    expect(printed).toEqual(measured)
    const labels = measureCell(preset, "warm", "light").ratios.map((r) => r.label)
    expect(labels).toEqual(expect.arrayContaining(["Body on the page", "Muted on the page"]))
  })

  it("marks a pair under 4.5:1 on the page itself", () => {
    // Warm muted text one step too light for its ground: the pairing the line feared.
    const faded = preset.replace("--vg-muted-foreground: #5c4a3d;", "--vg-muted-foreground: #a08f80;")
    expect(faded).not.toBe(preset)
    const muted = measureCell(faded, "warm", "light").ratios.find((r) => r.label === "Muted on the page")!
    expect(muted.value).toBeLessThan(AA_TEXT)
    expect(muted.fails).toBe(true)
    expect(siteReference(faded)).toContain(`class="ratio fail" data-ratio="${muted.value.toFixed(2)}"`)
    // And today's tokens mark nothing.
    expect(page).not.toContain('class="ratio fail"')
  })

  it("is placed on the canvas at the size its root draws", () => {
    const canvas = JSON.parse(readFileSync(join(root, "docs", "reference", "canvas.json"), "utf8")) as {
      artboards: { file: string; w: number; h: number }[]
    }
    const board = canvas.artboards.find((a) => a.file === "site.dc.html")
    expect(board).toMatchObject({ w: WIDTH, h: HEIGHT })
    expect(page).toContain(`width:${WIDTH}px;height:${HEIGHT}px`)
  })

  it("is listed in the reference's table", () => {
    expect(readFileSync(join(root, "docs", "reference", "README.md"), "utf8")).toContain("`site.dc.html`")
  })
})
