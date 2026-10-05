import { afterEach, describe, expect, it } from "vitest"

import { probe } from "./look-census-probe.mjs"

// VDS190 — what the census's in-page probe counts, on a page laid out by a real
// browser. The walk needs a running consumer; the probe needs only a document.

const FILL = "rgb(37, 99, 235)"

type Read = { primaries: number; cards: number; overlaps: number[]; samples: [string, string, number][] }

function page(html: string): Read {
  document.documentElement.style.setProperty("--primary", FILL)
  document.body.innerHTML = html
  return probe() as Read
}

const filled = (label: string, attrs = "") =>
  `<button ${attrs} style="background:${FILL};color:#fff;width:120px;height:36px">${label}</button>`

afterEach(() => {
  document.body.innerHTML = ""
})

describe("counting what a reader sees", () => {
  it("counts a button as a primary only when it is rendered visible", () => {
    const read = page(`
      <h1>Settings</h1>
      ${filled("Save")}
      <div style="opacity:0">${filled("Save")}</div>
    `)
    expect(read.primaries).toBe(1)
    expect(read.samples.filter(([figure]) => figure === "button-height")).toHaveLength(1)
  })

  it("never counts a switch, checkbox or toggle that is on as a primary", () => {
    const read = page(`
      <h1>Token</h1>
      ${filled("Save")}
      ${filled("Enabled", 'role="switch" aria-checked="true"')}
      ${filled("Remember", 'role="checkbox" aria-checked="true"')}
      ${filled("Bold", 'aria-pressed="true"')}
    `)
    expect(read.primaries).toBe(1)
    expect(read.samples.filter(([figure]) => figure === "primary-fill")).toHaveLength(1)
  })

  it("leaves a button drawn as text out of the control heights", () => {
    const read = page(`
      <h1>Group</h1>
      <button style="height:32px">Save</button>
      <button data-look="text" style="height:33px">Editors</button>
    `)
    const heights = read.samples.filter(([figure]) => figure === "button-height").map(([, value]) => value)
    expect(heights).toEqual(["32"])
  })

  it("counts a button taller than the touch step as a card, and a short pill as a control", () => {
    const read = page(`
      <h1>Files</h1>
      <button style="display:block;width:240px;height:343px">report.pdf</button>
      <button style="height:22px;border-radius:999px">Draft</button>
      <button style="height:44px">Menu</button>
    `)
    const heights = read.samples.filter(([figure]) => figure === "button-height").map(([, value]) => value)
    expect(heights).toEqual(["22", "44"])
    expect(read.cards).toBe(1)
  })

  it("reads a mono stack with a library's appended fallbacks as the same face", () => {
    const token = `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`
    const read = page(`
      <h1>Explorer</h1>
      <code style='font-family:${token}'>query</code>
      <code style='font-family:${token}, Consolas, "Courier New", monospace'>mutation</code>
      <code style='font-family:Menlo, monospace'>other</code>
    `)
    const monos = new Set(read.samples.filter(([figure]) => figure === "mono").map(([, value]) => value))
    expect([...monos].sort()).toEqual(["JetBrains Mono, ui-monospace", "Menlo, monospace"])
  })

  it("does not read a control scrolled under a sticky header as covered by its dock", () => {
    const read = page(`
      <header style="position:sticky;top:0;height:60px;z-index:30">
        <div data-slot="bento-shell-dock" style="position:relative;display:flex;width:200px;height:40px">
          <button style="width:40px;height:40px">Dock</button>
        </div>
      </header>
      <a href="#tile" style="display:block;position:relative;top:-50px;width:300px;height:80px">Tile</a>
    `)
    expect(read.overlaps).toEqual([])
  })

  it("reads a control under a fixed corner as covered, but not under its hidden part", () => {
    const corner = (hidden: string) => `
      <div data-slot="bento-shell-corner" style="position:fixed;right:0;bottom:0;display:flex;flex-direction:column">
        <button style="width:60px;height:60px${hidden}">Top</button>
        <button style="width:60px;height:60px">Dock</button>
      </div>`
    const under = (bottom: number) =>
      `<button style="position:fixed;right:0;bottom:${bottom}px;width:60px;height:40px">Under</button>`

    // Beneath the dock itself: covered.
    expect(page(`<h1>Hub</h1>${corner("")}${under(10)}`).overlaps).toHaveLength(1)
    // Beneath the back-to-top control while it waits at opacity 0: not covered.
    expect(page(`<h1>Hub</h1>${corner(";opacity:0")}${under(70)}`).overlaps).toEqual([])
    // The same control once back-to-top shows: covered.
    expect(page(`<h1>Hub</h1>${corner("")}${under(70)}`).overlaps).toHaveLength(1)
  })
})
