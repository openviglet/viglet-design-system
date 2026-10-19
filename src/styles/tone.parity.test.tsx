import { afterEach, describe, expect, it } from "vitest"

import "@/styles/index.css"
import preset from "@/styles/preset.css?raw"

/**
 * VDS213 — a tone re-keys the ground under the accent.
 *
 * VDS23 made the accent a token, and the accent is only the highlight: the
 * neutrals, the brand palette, the gradient, the footer and the display face
 * stayed Viglet's, so a family with a warm ground still had to override the
 * preset. `data-tone` is the layer above the accent, and what is asserted here is
 * what the browser resolves, not what the stylesheet says:
 *
 *   * `cool` is today's output, value for value, with or without the attribute;
 *   * `warm` moves every token the tone governs, on both grounds;
 *   * it works from a wrapper as well as from the root, aliases included.
 */

/** The tokens the warm block declares: what the tone governs, read from the preset. */
const governed = (() => {
  const open = preset.indexOf('[data-tone="warm"] {')
  const body = preset.slice(open, preset.indexOf("}", open))
  return [...body.matchAll(/^\s*(--[\w-]+):/gm)].map((m) => m[1])
})()

/** Every brand, footer and neutral token the cool :root declares. */
const coolGround = (() => {
  const root = preset.slice(preset.indexOf(":root {"), preset.indexOf("@media (pointer: coarse)"))
  const names = [...root.matchAll(/^\s*(--vg-[\w-]+):/gm)].map((m) => m[1])
  const neutral = /^--vg-(background|foreground|card|popover|primary|secondary|muted|accent-foreground|accent$|border|input|ring|sidebar)/
  return names.filter((n) => /^--vg-(brand|gradient|footer)/.test(n) || neutral.test(n) || n === "--vg-accent")
})()

/** Inputs and the outputs that follow the accent rather than the ground. */
const FOLLOWS_THE_ACCENT_ON_DARK = new Set(["--vg-ring", "--vg-sidebar-ring"])
/** Product inputs: the tone gives them a value, and a product's :root overrides it. */
const INPUTS = /^--vg-primary(-foreground)?-base/

function read(el: Element, names: readonly string[]): Record<string, string> {
  const style = getComputedStyle(el)
  return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]))
}

function underRoot(tone: string | null, dark: boolean): Record<string, string> {
  const root = document.documentElement
  if (tone === null) delete root.dataset.tone
  else root.dataset.tone = tone
  root.classList.toggle("dark", dark)
  return read(root, [...governed, "--font-sans"])
}

afterEach(() => {
  delete document.documentElement.dataset.tone
  document.documentElement.classList.remove("dark")
})

describe("VDS213: a tone above the accent", () => {
  it("governs every brand, footer and neutral token, and the display face", () => {
    expect(governed.length, "the warm block was not found, so nothing below asserts anything").toBeGreaterThan(40)
    expect(coolGround.length).toBeGreaterThan(30)
    const missing = coolGround.filter((n) => !governed.includes(n))
    expect(missing, "the warm tone leaves these at Viglet's value").toEqual([])
    expect(governed).toContain("--font-brand")
  })

  it.each([false, true])("leaves cool exactly as it was, dark=%s", (dark) => {
    const none = underRoot(null, dark)
    const cool = underRoot("cool", dark)
    expect(cool).toEqual(none)
    // Non-vacuous: the values were read, not all empty.
    expect(none["--vg-background"]).not.toBe("")
    expect(none["--vg-footer-bg"]).not.toBe("")
  })

  it.each([false, true])("moves every governed token under warm, dark=%s", (dark) => {
    const cool = underRoot("cool", dark)
    const warm = underRoot("warm", dark)
    const unmoved = governed.filter((n) => {
      if (n.startsWith("--vg-") === false && n !== "--font-brand") return false
      if (INPUTS.test(n)) return false
      if (dark && FOLLOWS_THE_ACCENT_ON_DARK.has(n)) return false
      return warm[n] === cool[n]
    })
    expect(unmoved, "warm declares these and the browser resolved the cool value").toEqual([])
    expect(warm["--font-brand"], "the display face resolved to nothing").toContain("Inter")
    expect(warm["--font-brand"]).toBe(warm["--font-sans"])
  })

  it("keeps the focus ring on the accent on the dark ground, whatever the tone", () => {
    const warm = underRoot("warm", true)
    const cool = underRoot("cool", true)
    for (const n of FOLLOWS_THE_ACCENT_ON_DARK) expect(warm[n], n).toBe(cool[n])
  })

  it("gives the dark ground its own warm set, wherever the mode sits", () => {
    const sameElement = underRoot("warm", true)["--vg-background"]
    expect(sameElement).not.toBe(underRoot("warm", false)["--vg-background"])

    // The mode below the tone, and the tone below the mode.
    const root = document.documentElement
    root.dataset.tone = "warm"
    const darkInside = document.createElement("div")
    darkInside.className = "dark"
    document.body.appendChild(darkInside)
    expect(read(darkInside, ["--vg-background"])["--vg-background"]).toBe(sameElement)
    darkInside.remove()

    delete root.dataset.tone
    root.classList.add("dark")
    const warmInside = document.createElement("div")
    warmInside.dataset.tone = "warm"
    document.body.appendChild(warmInside)
    expect(read(warmInside, ["--vg-background"])["--vg-background"]).toBe(sameElement)
    warmInside.remove()
  })

  it("re-keys a subtree, the back-compat aliases and the primary fill included", () => {
    const wrapper = document.createElement("div")
    wrapper.dataset.tone = "warm"
    document.body.appendChild(wrapper)

    const inside = read(wrapper, ["--vg-background", "--background", "--vg-primary", "--primary"])
    const outside = read(document.documentElement, ["--background", "--primary"])
    expect(inside["--background"]).toBe(inside["--vg-background"])
    expect(inside["--background"]).not.toBe(outside["--background"])
    expect(inside["--primary"]).toBe(inside["--vg-primary"])
    expect(inside["--primary"]).not.toBe(outside["--primary"])

    // What a component actually paints: Tailwind's bg-background reads the token.
    const page = document.createElement("div")
    page.className = "bg-background"
    wrapper.appendChild(page)
    const outsidePage = document.createElement("div")
    outsidePage.className = "bg-background"
    document.body.appendChild(outsidePage)
    expect(getComputedStyle(page).backgroundColor).not.toBe(getComputedStyle(outsidePage).backgroundColor)

    outsidePage.remove()
    wrapper.remove()
  })
})
