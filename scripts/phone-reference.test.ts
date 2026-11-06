import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { BOARDS, DIR, HEIGHT, WIDTH, palette, phoneReference, sizes } from "./phone-reference.mjs"

// VDS241 — the phone boards are generated, so what has to hold is that the
// committed boards are the generator's current output, drawn at the touch
// height and in the state colours the tokens state.

const root = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
const boards = phoneReference(preset)
const committed = (file: string) => readFileSync(join(DIR, file), "utf8")

describe("docs/reference/phone-*.dc.html", () => {
  it("are what the generator draws from today's tokens", () => {
    for (const { file } of BOARDS) {
      expect(committed(file), `${file} is stale: run node scripts/phone-reference.mjs`).toBe(boards[file])
    }
  })

  it("draw every target at the touch height or larger", () => {
    const { touch } = sizes(preset)
    expect(touch).toBe(44)
    for (const { file } of BOARDS) {
      for (const [, px] of committed(file).matchAll(/class="(?:control|primary-action)" data-px="(\d+)"/g)) {
        expect(Number(px), file).toBeGreaterThanOrEqual(touch)
      }
    }
  })

  it("mark each record's state in its token's colour", () => {
    const light = palette(preset, "light")
    const states = [...committed("phone-list.dc.html").matchAll(/data-state="(\w+)" data-colour="(#[0-9a-f]{6})"/g)]
    expect(states.map((m) => m[1])).toEqual(["published", "draft", "scheduled", "changed", "archived"])
    for (const [, state, colour] of states) expect(colour).toBe(light[`bento-state-${state}`])
  })

  it("draw the full-screen surface on the dark ground", () => {
    expect(committed("phone-fullscreen.dc.html")).toContain(`data-ground="dark"`)
    expect(committed("phone-fullscreen.dc.html")).toContain(`background:${palette(preset, "dark").background}`)
  })

  it("are placed on the canvas at the size their roots draw, and listed in the table", () => {
    const canvas = JSON.parse(readFileSync(join(DIR, "canvas.json"), "utf8")) as {
      pages: { id: string }[]
      artboards: { file: string; w: number; h: number; page: string }[]
    }
    const readme = readFileSync(join(DIR, "README.md"), "utf8")
    for (const { file } of BOARDS) {
      const board = canvas.artboards.find((a) => a.file === file)
      expect(board, file).toMatchObject({ w: WIDTH, h: HEIGHT })
      expect(canvas.pages.map((p) => p.id)).toContain(board!.page)
      expect(committed(file)).toContain(`width:${WIDTH}px;height:${HEIGHT}px`)
      expect(readme).toContain(`\`${file}\``)
    }
  })

  it("have their rules written beside them, in BENTO-AUTHORING", () => {
    expect(readFileSync(join(root, "docs", "BENTO-AUTHORING.md"), "utf8")).toMatch(/^## 8\. Phone-first$/m)
  })
})
