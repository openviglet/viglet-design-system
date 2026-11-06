/**
 * VDS238 — the preset's tokens as resolved values, for a reader that is not a
 * browser.
 *
 * Every token is a CSS custom property, and most colours are `oklch()` or a
 * `color-mix()` over another property. A browser resolves that; a React Native
 * StyleSheet, a design tool's colour picker and an agent reading the MCP
 * resource do not. This writes the same tokens in the W3C design-tokens format
 * with every value worked out: each colour for every tone on both grounds, the
 * dimensions, and the font stacks.
 *
 * The arithmetic is `contrast.mjs`'s, the one the contrast gate and the site
 * reference page measure with, so the JSON cannot disagree with the ratios they
 * report. It is generated at build time from `preset.css` and never edited.
 *
 * What a reader gets per colour: `$value` is the DTCG colour object (OKLCH
 * components, alpha, and the 6-digit `hex` the spec defines), and
 * `$extensions["com.viglet"].reactNative` is the one string a StyleSheet takes,
 * `#rrggbbaa` where the colour is translucent. A dimension's `reactNative` is
 * its size in px at a 16 px root.
 */
import { groundTokens, hexa, oklch, parseColour, resolveToken, ruleBlocks } from "./contrast.mjs"

const PREFIX = "--vg-"

/** Inputs a product sets to claim `--primary`; the tokens they feed are what a reader wants. */
const PLUMBING = /-base(-dark)?$/

const EXTENSION = "com.viglet"
const ROOT_PX = 16

const round = (value, places) => Number(value.toFixed(places))

/** The tones the preset declares, `cool` (the default, declared by no block) first. */
export function tonesOf(preset) {
  const found = new Set(["cool"])
  for (const [, tone] of preset.matchAll(/\[data-tone=["']?([\w-]+)["']?\]/g)) found.add(tone)
  return [...found]
}

function colourToken(colour) {
  const [L, C, H] = oklch(colour)
  const opaque = hexa({ ...colour, alpha: 1 })
  return {
    $type: "color",
    $value: {
      colorSpace: "oklch",
      components: [round(L, 4), round(C, 4), round(H, 2)],
      alpha: round(colour.alpha, 3),
      hex: opaque,
    },
    $extensions: { [EXTENSION]: { reactNative: hexa(colour) } },
  }
}

/** One ground of one tone: every `--vg-*` that resolves to a colour, by name without the prefix. */
function colours(preset, tone, ground) {
  const { tokens } = groundTokens([{ name: "preset.css", css: preset }], ground, tone)
  const group = {}
  for (const [name, value] of tokens) {
    if (!name.startsWith(PREFIX) || PLUMBING.test(name)) continue
    const colour = parseColour(value, tokens)
    if (colour) group[name.slice(PREFIX.length)] = colourToken(colour)
  }
  return group
}

/** `0.375rem` or `9999px` as a DTCG dimension, or null. */
function dimension(value) {
  const match = /^(-?[\d.]+)(rem|px)$/.exec(value.trim())
  return match ? { value: Number(match[1]), unit: match[2] } : null
}

const px = ({ value, unit }) => (unit === "rem" ? value * ROOT_PX : value)

/** The custom properties of the untoned `:root` blocks, plain and under a media query. */
function rootDeclarations(preset) {
  const plain = new Map()
  const coarse = new Map()
  for (const block of ruleBlocks(preset)) {
    if (!block.selectors.includes(":root")) continue
    if (block.atRules.length === 0) for (const [k, v] of block.declarations) plain.set(k, v)
    else if (block.atRules.some((rule) => /pointer:\s*coarse/.test(rule))) {
      for (const [k, v] of block.declarations) coarse.set(k, v)
    }
  }
  return { plain, coarse }
}

/**
 * Every `--vg-*` length on `:root`. Where a touch screen (`pointer: coarse`)
 * resolves it differently, that value rides along, since a phone is one.
 */
function dimensions(preset) {
  const { plain, coarse } = rootDeclarations(preset)
  const touch = new Map([...plain, ...coarse])
  const group = {}
  for (const [name, value] of plain) {
    if (!name.startsWith(PREFIX)) continue
    const size = dimension(resolveToken(plain, value))
    if (!size) continue
    const extension = { reactNative: px(size) }
    const onTouch = dimension(resolveToken(touch, touch.get(name)))
    if (onTouch && px(onTouch) !== px(size)) extension.coarse = { ...onTouch, reactNative: px(onTouch) }
    group[name.slice(PREFIX.length)] = { $type: "dimension", $value: size, $extensions: { [EXTENSION]: extension } }
  }
  return group
}

/** A `font-family` value as its list of families, unquoted. */
function families(value) {
  return value
    .split(",")
    .map((part) => part.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
}

/**
 * The faces: `--font-sans` and `--font-brand` from `@theme`, `--vg-font-mono`
 * from `:root`. A tone that swaps a face (warm and navy draw the display face in
 * Inter) is recorded beside the default rather than as a second token.
 */
function fonts(preset, tones) {
  const theme = new Map()
  for (const block of ruleBlocks(preset)) {
    if (block.selectors.some((s) => /^@theme(\s|$)/.test(s)) && !block.selectors.some((s) => /inline/.test(s))) {
      for (const [k, v] of block.declarations) theme.set(k, v)
    }
  }
  const { plain } = rootDeclarations(preset)
  const base = new Map([...theme, ...plain])
  const names = [...base.keys()].filter((name) => /^--(vg-)?font-/.test(name))

  const group = {}
  for (const name of names) {
    const stack = families(resolveToken(base, base.get(name)))
    const byTone = {}
    for (const tone of tones.slice(1)) {
      const { tokens } = groundTokens([{ name: "preset.css", css: preset }], "light", tone)
      const merged = new Map([...base, ...tokens])
      const toned = families(resolveToken(merged, merged.get(name)))
      if (toned.join() !== stack.join()) byTone[tone] = toned
    }
    const key = name.replace(/^--(vg-)?font-/, "")
    group[key] = { $type: "fontFamily", $value: stack }
    if (Object.keys(byTone).length > 0) group[key].$extensions = { [EXTENSION]: { tones: byTone } }
  }
  return group
}

/** The whole file, as an object. `JSON.stringify(tokensJson(css), null, 2)` is what ships. */
export function tokensJson(preset) {
  const tones = tonesOf(preset)
  const color = {}
  for (const tone of tones) {
    color[tone] = { light: colours(preset, tone, "light"), dark: colours(preset, tone, "dark") }
  }
  return {
    $description:
      "Viglet Design System tokens, resolved. Generated from preset.css by scripts/build-tokens.mjs; edit that. " +
      'color.<tone>.<ground>.<name> is the --vg-<name> property on that ground under [data-tone="<tone>"] ("cool" is the default). ' +
      '$extensions["com.viglet"].reactNative is the value a React Native StyleSheet takes.',
    color,
    dimension: dimensions(preset),
    font: fonts(preset, tones),
  }
}
