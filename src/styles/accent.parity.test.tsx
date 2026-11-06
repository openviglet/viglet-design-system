import { afterEach, describe, expect, it } from "vitest"

import "@/styles/index.css"

/**
 * VDS242 — an accent preset, claimed by name with `data-accent`, asserted on
 * what the browser resolves rather than on what the stylesheet says: on the
 * root and on a subtree, on both grounds, the derived tokens included, since a
 * custom property substitutes its var() where it is declared.
 */

const DERIVED = ["--vg-accent-fg", "--vg-accent-surface", "--vg-accent-fill-from", "--vg-primary", "--primary"] as const

function read(el: Element, names: readonly string[]): Record<string, string> {
  const style = getComputedStyle(el)
  return Object.fromEntries(names.map((n) => [n, style.getPropertyValue(n).trim()]))
}

afterEach(() => {
  delete document.documentElement.dataset.accent
  document.documentElement.classList.remove("dark")
  document.body.replaceChildren()
})

describe("VDS242: an accent preset", () => {
  it.each([false, true])("re-keys the accent and the primary from the root, dark=%s", (dark) => {
    const root = document.documentElement
    root.classList.toggle("dark", dark)
    const before = read(root, DERIVED)
    root.dataset.accent = "violet"
    const after = read(root, DERIVED)
    for (const name of DERIVED) expect(after[name], name).not.toBe(before[name])
    expect(after["--primary"]).toBe(after["--vg-primary"])
  })

  it.each([false, true])("works on a subtree as it does on the root, dark=%s", (dark) => {
    const root = document.documentElement
    root.classList.toggle("dark", dark)
    root.dataset.accent = "amber"
    const onRoot = read(root, DERIVED)
    delete root.dataset.accent

    const wrapper = document.createElement("div")
    wrapper.dataset.accent = "amber"
    document.body.appendChild(wrapper)
    const inside = read(wrapper, DERIVED)
    const outside = read(document.body, DERIVED)
    expect(inside).toEqual(onRoot)
    for (const name of DERIVED) expect(inside[name], name).not.toBe(outside[name])

    // What a component paints: Tailwind's bg-primary reads the token.
    const fill = document.createElement("div")
    fill.className = "bg-primary"
    wrapper.appendChild(fill)
    const plain = document.createElement("div")
    plain.className = "bg-primary"
    document.body.appendChild(plain)
    expect(getComputedStyle(fill).backgroundColor).not.toBe(getComputedStyle(plain).backgroundColor)
  })

  it("follows the mode set below it", () => {
    const wrapper = document.createElement("div")
    wrapper.dataset.accent = "teal"
    const dark = document.createElement("div")
    dark.className = "dark"
    wrapper.appendChild(dark)
    document.body.appendChild(wrapper)
    expect(read(dark, ["--vg-accent-fg"])["--vg-accent-fg"]).not.toBe(read(wrapper, ["--vg-accent-fg"])["--vg-accent-fg"])
  })
})
