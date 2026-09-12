/**
 * VDS137 — the token pairs a product has to keep legible, measured on whatever
 * stylesheets it ships, not only on the preset.
 *
 * The contrast gate measured the preset's own pairs and nothing else. A product
 * claims its accent and its `--primary` in its own stylesheet, which no gate
 * read, so a re-keyed orange could sit near 3.6:1 as text with every check green.
 * This is that gate's arithmetic, lifted out so the package's test and a
 * consumer's `viglet-ds-page-lint --contrast` measure the same way.
 *
 * **The cascade, modelled.** The stylesheets are read in order, as a product
 * imports them: the preset first, then the product's. A ground's tokens are every
 * `:root` block, with the dark blocks laid over them for the dark ground. A
 * product's own `:root` comes after the preset's dark block at the same
 * specificity, so it wins on both grounds, which is exactly why setting
 * `--vg-primary` there keys the dark ground to the light value, and exactly what
 * this measures.
 *
 * **Arithmetic, not a browser.** Colours are converted to OKLab (Ottosson's
 * matrices), mixed there when a token is a `color-mix(in oklab, …)`, and taken to
 * linear sRGB for WCAG's relative luminance. A value it cannot read is reported
 * as unread, never measured as black.
 */

/** WCAG 2 AA for body text. */
export const AA_TEXT = 4.5

const DARK_SELECTOR = /(^|[\s,])(\.dark|\[data-theme=["']?dark["']?\]|:root\.dark|html\.dark)(?=$|[\s,{:])/
const ROOT_SELECTOR = /^(:root|html)$/

/**
 * Every innermost rule block in a stylesheet: its selector list, the at-rules
 * around it, and its custom-property declarations, in source order.
 */
export function ruleBlocks(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const blocks = []
  const stack = []
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === "{") {
      stack.push({ prelude: text.slice(start, i).trim(), body: i + 1, nested: false })
      if (stack.length > 1) stack[stack.length - 2].nested = true
      start = i + 1
    } else if (char === "}") {
      const open = stack.pop()
      if (open && !open.nested) {
        const declarations = new Map()
        for (const part of text.slice(open.body, i).split(";")) {
          const at = part.indexOf(":")
          if (at === -1) continue
          const name = part.slice(0, at).trim()
          if (name.startsWith("--")) declarations.set(name, part.slice(at + 1).trim())
        }
        blocks.push({
          selectors: open.prelude.split(",").map((s) => s.trim()),
          atRules: stack.map((s) => s.prelude),
          declarations,
        })
      }
      start = i + 1
    } else if (char === ";" && stack.length === 0) {
      start = i + 1
    }
  }
  return blocks
}

function groundOf(block) {
  if (block.atRules.some((rule) => /^@theme/.test(rule))) return null
  const darkMedia = block.atRules.some((rule) => /prefers-color-scheme:\s*dark/.test(rule))
  if (block.selectors.some((s) => DARK_SELECTOR.test(s))) return "dark"
  if (block.selectors.some((s) => ROOT_SELECTOR.test(s))) return darkMedia ? "dark" : "light"
  return null
}

/**
 * One ground's tokens across the stylesheets, in cascade order, with where each
 * was last declared, so a finding can name the product's line and not the preset's.
 */
export function groundTokens(sheets, ground) {
  const tokens = new Map()
  const origin = new Map()
  for (const { name, css } of sheets) {
    for (const block of ruleBlocks(css)) {
      const which = groundOf(block)
      if (which === "light" || (ground === "dark" && which === "dark")) {
        for (const [token, value] of block.declarations) {
          tokens.set(token, value)
          origin.set(token, name)
        }
      }
    }
  }
  return { tokens, origin }
}

/** Follow `var(--x)` and `var(--x, fallback)` to the value it names. */
export function resolveToken(tokens, value, depth = 8) {
  let current = value.trim()
  for (let hop = 0; hop < depth; hop++) {
    const points = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/.exec(current)
    if (!points) return current
    const next = tokens.get(points[1])
    if (next === undefined) {
      if (points[2] === undefined) return current
      current = points[2].trim()
    } else {
      current = next.trim()
    }
  }
  return current
}

// ---------------------------------------------------------------------------
// Colour.

const srgbToLinear = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)

function linearToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToLinear({ L, a, b }) {
  const long = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const medium = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const short = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (x) => Math.min(1, Math.max(0, x))
  return [
    clamp(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    clamp(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    clamp(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short),
  ]
}

function hslToSrgb(h, s, l) {
  const k = (n) => (n + h / 30) % 12
  const f = (n) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

const number = (text, scale = 1) => (text.endsWith("%") ? Number(text.slice(0, -1)) / 100 : Number(text) / scale)

/** A colour literal as OKLab with alpha, or null where it is not one this reads. */
export function parseColour(value, tokens = new Map()) {
  const text = resolveToken(tokens, value).toLowerCase()
  if (text === "white") return { L: 1, a: 0, b: 0, alpha: 1 }
  if (text === "black") return { L: 0, a: 0, b: 0, alpha: 1 }
  if (text === "transparent") return { L: 0, a: 0, b: 0, alpha: 0 }

  const hex = /^#([0-9a-f]{3,8})$/.exec(text)
  if (hex) {
    let digits = hex[1]
    if (digits.length <= 4) digits = [...digits].map((d) => d + d).join("")
    const bytes = digits.match(/../g).map((pair) => Number.parseInt(pair, 16) / 255)
    return { ...linearToOklab(bytes.slice(0, 3).map(srgbToLinear)), alpha: bytes[3] ?? 1 }
  }

  const fn = /^(oklch|oklab|rgba?|hsla?)\(\s*([^)]*)\)$/.exec(text)
  if (fn) {
    const parts = fn[2].split(/[\s,/]+/).filter(Boolean)
    const alpha = parts[3] === undefined ? 1 : number(parts[3])
    if (fn[1] === "oklch") {
      const L = number(parts[0])
      const C = Number(parts[1])
      const H = (Number.parseFloat(parts[2]) * Math.PI) / 180
      return { L, a: C * Math.cos(H), b: C * Math.sin(H), alpha }
    }
    if (fn[1] === "oklab") return { L: number(parts[0]), a: Number(parts[1]), b: Number(parts[2]), alpha }
    if (fn[1].startsWith("rgb")) {
      const channels = parts.slice(0, 3).map((p) => number(p, 255))
      return { ...linearToOklab(channels.map(srgbToLinear)), alpha }
    }
    const [h, s, l] = [Number.parseFloat(parts[0]), number(parts[1]), number(parts[2])]
    return { ...linearToOklab(hslToSrgb(h, s, l).map(srgbToLinear)), alpha }
  }

  // color-mix(in oklab, <colour> [p%], <colour> [p%]): the one space the preset mixes in.
  const mix = /^color-mix\(\s*in\s+oklab\s*,\s*(.+)\)$/.exec(text)
  if (mix) {
    const args = splitTopLevel(mix[1])
    if (args.length !== 2) return null
    const [first, second] = args.map((arg) => {
      const weighted = /^(.*?)\s+([\d.]+)%$/.exec(arg.trim())
      return weighted ? { colour: weighted[1], weight: Number(weighted[2]) / 100 } : { colour: arg.trim(), weight: null }
    })
    const p1 = first.weight ?? (second.weight === null ? 0.5 : 1 - second.weight)
    const a = parseColour(first.colour, tokens)
    const b = parseColour(second.colour, tokens)
    if (!a || !b) return null
    const lerp = (x, y) => x * p1 + y * (1 - p1)
    return { L: lerp(a.L, b.L), a: lerp(a.a, b.a), b: lerp(a.b, b.b), alpha: lerp(a.alpha, b.alpha) }
  }
  return null
}

function splitTopLevel(text) {
  const out = []
  let depth = 0
  let from = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "(") depth++
    else if (text[i] === ")") depth--
    else if (text[i] === "," && depth === 0) {
      out.push(text.slice(from, i))
      from = i + 1
    }
  }
  out.push(text.slice(from))
  return out
}

/** WCAG relative luminance of an opaque colour; a translucent one has no single answer. */
export function luminance(colour) {
  if (!colour || colour.alpha < 1) return null
  const [r, g, b] = oklabToLinear(colour)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function ratio(front, behind) {
  return (Math.max(front, behind) + 0.05) / (Math.min(front, behind) + 0.05)
}

// ---------------------------------------------------------------------------
// The pairs.

/**
 * Pairs a name alone cannot derive: the page and muted text on it, the accented
 * label on the page, and the white label the gradient button and the checked
 * switch draw on the accent fill.
 */
const NAMED_PAIRS = [
  ["--vg-background", "--vg-foreground"],
  ["--vg-background", "--vg-muted-foreground"],
  ["--vg-background", "--vg-accent-fg"],
  ["--vg-accent-fill-from", "white"],
  ["--vg-accent-fill-to", "white"],
]

/** Every `--vg-X` with a `--vg-X-foreground`, and the named pairs, where both sides are declared. */
export function pairsOf(tokens) {
  const declared = (name) => name === "white" || tokens.has(name)
  const derived = [...tokens.keys()]
    .filter((name) => name.startsWith("--vg-") && name.endsWith("-foreground"))
    .map((foreground) => [foreground.slice(0, -"-foreground".length), foreground])
    .filter(([surface]) => tokens.has(surface))
  const named = NAMED_PAIRS.filter(([surface, foreground]) => declared(surface) && declared(foreground))
  const seen = new Set()
  return [...named, ...derived].filter(([s, f]) => {
    const key = `${s} ${f}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Every pair on one ground, measured: `ratio` is null where either side does not
 * resolve to an opaque colour this reads, and `unread` names which.
 */
export function measurePairs(sheets, ground) {
  const { tokens, origin } = groundTokens(sheets, ground)

  /**
   * Every stylesheet a token's value passes through on its way to a colour.
   * `--vg-primary` is the preset's, and `--vg-primary-base` it points at is the
   * product's: a finding has to name the second.
   */
  const through = (name) => {
    const found = []
    let current = name
    for (let hop = 0; hop < 8 && current; hop++) {
      if (origin.has(current)) found.push({ token: current, sheet: origin.get(current) })
      const points = /var\(\s*(--[\w-]+)/.exec(tokens.get(current) ?? "")
      current = points?.[1]
    }
    return found
  }
  return pairsOf(tokens).map(([surface, foreground]) => {
    const behind = luminance(parseColour(tokens.get(surface) ?? "", tokens))
    const front = luminance(parseColour(foreground === "white" ? "white" : (tokens.get(foreground) ?? ""), tokens))
    const unread = [behind === null ? surface : null, front === null ? foreground : null].filter(Boolean)
    return {
      ground,
      surface,
      foreground,
      ratio: unread.length === 0 ? ratio(front, behind) : null,
      unread,
      origin: [...new Set([...through(surface), ...through(foreground)].map((d) => d.sheet))],
      declared: [...through(surface), ...through(foreground)],
    }
  })
}
