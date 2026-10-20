import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { groundTokens } from "./lib/contrast.mjs"
import { tokensCss } from "./lib/tokens-css.mjs"

/**
 * VDS216 — `tokens.css` is the preset a browser can read with no build. It is
 * derived, so what is asserted is that the derivation keeps every token and
 * every ground and drops only what a browser would have ignored anyway.
 */

const root = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
const tokens = tokensCss(preset)

describe("tokens.css, derived from the preset", () => {
  it("carries no rule only Tailwind understands", () => {
    expect(tokens).not.toMatch(/@theme\b/)
    expect(tokens).not.toMatch(/@custom-variant\b/)
    expect(tokens).not.toContain("--color-background")
  })

  it("declares every --vg-* token the preset declares", () => {
    const declared = (css: string) => new Set([...css.matchAll(/^\s*(--vg-[\w-]+):/gm)].map((m) => m[1]))
    const missing = [...declared(preset)].filter((name) => !declared(tokens).has(name))
    expect(missing).toEqual([])
    expect(declared(preset).size).toBeGreaterThan(100)
  })

  it("moves the faces into :root, where a page can read them", () => {
    const light = groundTokens([{ name: "tokens.css", css: tokens }], "light").tokens
    expect(light.get("--font-sans")).toContain("Inter")
    expect(light.get("--font-brand")).toContain("Plus Jakarta Sans")
  })

  it.each([
    ["cool", "light"],
    ["cool", "dark"],
    ["warm", "light"],
    ["warm", "dark"],
  ] as const)("resolves the %s tone on the %s ground exactly as the preset does", (tone, ground) => {
    const from = (css: string) => groundTokens([{ name: "x", css }], ground, tone).tokens
    const derived = from(tokens)
    for (const [name, value] of from(preset)) expect(derived.get(name), name).toBe(value)
  })

  it("balances its braces", () => {
    const text = tokens.replace(/\/\*[\s\S]*?\*\//g, "")
    expect(text.split("{").length).toBe(text.split("}").length)
  })

  it("is what the build writes and the package exports", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
    expect(pkg.exports["./tokens.css"]).toBe("./dist/tokens.css")
    expect(pkg.scripts.build).toContain("node scripts/build-tokens.mjs")
  })

  it("refuses a preset with no faces to move", () => {
    expect(() => tokensCss(":root { --vg-x: red; }")).toThrow("no @theme block")
  })
})
