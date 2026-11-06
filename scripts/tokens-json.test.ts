import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { groundTokens, hex, parseColour } from "./lib/contrast.mjs"
import { tokensJson, tonesOf } from "./lib/tokens-json.mjs"

// VDS238 — the tokens a native app or a design tool reads. Generated from the
// preset at build time, so these hold the generator: every colour the preset
// declares is in it, on every tone and ground, with a hex React Native takes.

const root = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
const json = tokensJson(preset)

/** `#rrggbb` or `#rrggbbaa`: the two hex forms a React Native StyleSheet reads. */
const NATIVE_HEX = /^#[0-9a-f]{6}([0-9a-f]{2})?$/

describe("tokens.json", () => {
  it("has a group for every tone the preset declares, on both grounds", () => {
    expect(tonesOf(preset)).toEqual(["cool", "warm", "navy"])
    expect(Object.keys(json.color)).toEqual(tonesOf(preset))
    for (const tone of Object.values(json.color)) expect(Object.keys(tone)).toEqual(["light", "dark"])
  })

  it("carries every colour the preset resolves, so a new token cannot be left out", () => {
    for (const tone of tonesOf(preset)) {
      for (const ground of ["light", "dark"] as const) {
        const { tokens } = groundTokens([{ name: "preset.css", css: preset }], ground, tone)
        const expected = [...tokens]
          .filter(([name, value]) => name.startsWith("--vg-") && !/-base(-dark)?$/.test(name) && parseColour(value, tokens))
          .map(([name]) => name.slice("--vg-".length))
        expect(Object.keys(json.color[tone][ground]).sort(), `${tone}/${ground}`).toEqual(expected.sort())
      }
    }
  })

  it("gives every colour a hex a React Native StyleSheet accepts", () => {
    for (const tone of Object.values(json.color)) {
      for (const ground of Object.values(tone)) {
        for (const [name, token] of Object.entries(ground)) {
          expect(token.$extensions["com.viglet"].reactNative, name).toMatch(NATIVE_HEX)
          expect(token.$value.hex, name).toMatch(/^#[0-9a-f]{6}$/)
        }
      }
    }
  })

  it("agrees with the contrast gate's arithmetic on an opaque colour", () => {
    const { tokens } = groundTokens([{ name: "preset.css", css: preset }], "dark", "cool")
    const measured = hex(parseColour(tokens.get("--vg-accent-fill-from")!, tokens))
    expect(json.color.cool.dark["accent-fill-from"].$extensions["com.viglet"].reactNative).toBe(measured)
    expect(json.color.cool.light.background.$extensions["com.viglet"].reactNative).toBe("#ffffff")
  })

  it("writes a translucent token as 8-digit hex with its alpha", () => {
    // color-mix(in oklab, var(--vg-accent-from) 10%, transparent): the stop's
    // own colour at a tenth, 0x1a, not laid over a page.
    const surface = json.color.cool.light["accent-surface"]
    expect(surface.$value.alpha).toBe(0.1)
    expect(surface.$extensions["com.viglet"].reactNative).toBe(`${surface.$value.hex}1a`)
  })

  it("resolves the derived accent and the record states rather than naming a var()", () => {
    const light = json.color.cool.light
    // --vg-bento-state-published is var(--vg-bento-on-mark).
    expect(light["bento-state-published"].$value.hex).toBe(light["bento-on-mark"].$value.hex)
    // --vg-accent-fg is var(--vg-accent-text) on light and the -dark one on dark.
    expect(light["accent-fg"].$value.hex).toBe(light["accent-text"].$value.hex)
    expect(json.color.cool.dark["accent-fg"].$value.hex).toBe(json.color.cool.dark["accent-text-dark"].$value.hex)
  })

  it("re-keys the ground per tone", () => {
    expect(json.color.warm.light.background.$value.hex).not.toBe(json.color.cool.light.background.$value.hex)
    expect(json.color.navy.dark.background.$value.hex).not.toBe(json.color.cool.dark.background.$value.hex)
  })

  it("states the lengths in px, with the touch-screen heights beside the defaults", () => {
    expect(json.dimension["radius-control"].$extensions["com.viglet"].reactNative).toBe(6)
    expect(json.dimension["radius-panel"].$extensions["com.viglet"].reactNative).toBe(10)
    expect(json.dimension["control-form"].$extensions["com.viglet"]).toEqual({
      reactNative: 36,
      coarse: { value: 2.75, unit: "rem", reactNative: 44 },
    })
    expect(json.dimension["text-mono"].$value).toEqual({ value: 0.75, unit: "rem" })
  })

  it("lists the font stacks, with a tone's swapped face beside the default", () => {
    expect(json.font.sans.$value[0]).toBe("Inter Variable")
    expect(json.font.mono.$value[0]).toBe("JetBrains Mono")
    expect(json.font.brand.$value[0]).toBe("Plus Jakarta Sans Variable")
    expect(json.font.brand.$extensions?.["com.viglet"].tones.warm).toEqual(json.font.sans.$value)
  })
})
