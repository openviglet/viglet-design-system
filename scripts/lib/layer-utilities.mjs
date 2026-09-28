/**
 * VDS194 — where the package's compiled utilities sit in a consumer's cascade.
 *
 * `./styles` ships the Tailwind utilities its own components use, and every
 * consumer compiles the same class names from its own sources. Two
 * compilations of `.hidden { display: none }` end up in one `@layer utilities`,
 * and inside one layer the later copy wins. A consumer importing this package
 * after `tailwindcss`, the order the setup section shows, had the package's
 * `.hidden` beat its `lg:block`, and `hidden lg:block` rendered nothing at any
 * width.
 *
 * Moving every package utility below the consumer's only swaps the victim: a
 * consumer's `.hidden` would then beat the package's own `md:flex`, and the
 * package's responsive chrome would disappear instead. Tailwind never has this
 * problem inside one compilation, because it writes every plain utility before
 * every variant. This reproduces that order across the two compilations:
 *
 *   @layer utilities { @layer viglet { plain utilities } }   below the consumer's
 *   @layer viglet-variants { variant utilities }             above the consumer's
 *
 * A consumer's own utilities sit directly in `utilities`, and a layer's own
 * rules beat its nested layers, so the package's `.hidden` loses to anything
 * the consumer writes. `viglet-variants` is first named after `utilities`, so
 * it is ordered after it wherever the consumer imports this file, and the
 * package's `md:flex` still beats a consumer's plain `.hidden`.
 */
import postcss from "postcss"

export const PLAIN_LAYER = "viglet"
export const VARIANT_LAYER = "viglet-variants"

const CLASS = /\.((?:\\[0-9a-fA-F]{1,6}\s?|\\[^0-9a-fA-F]|[\w-])+)/

function unescape(ident) {
  return ident
    .replaceAll(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replaceAll(/\\(.)/g, "$1")
}

/**
 * True when the rule's utility carries a variant: `lg:block`, `hover:bg-x`,
 * `[&>svg]:size-4`. The candidate is the first class in the selector, and its
 * variant separator is a colon outside brackets, so an arbitrary property such
 * as `[mask-type:luminance]` stays a plain utility.
 */
export function isVariantRule(selector) {
  const match = CLASS.exec(selector)
  if (!match) return false
  let depth = 0
  for (const char of unescape(match[1])) {
    if (char === "[" || char === "(") depth++
    else if (char === "]" || char === ")") depth--
    else if (char === ":" && depth === 0) return true
  }
  return false
}

/** Splits one node into its plain and its variant halves; either may be null. */
function split(node) {
  if (node.type === "rule") return isVariantRule(node.selector) ? [null, node] : [node, null]
  if (node.type !== "atrule" || !node.nodes) return [node, null]
  const plain = node.clone({ nodes: [] })
  const variant = node.clone({ nodes: [] })
  for (const child of node.nodes) {
    const [p, v] = split(child)
    if (p) plain.append(p.clone())
    if (v) variant.append(v.clone())
  }
  return [plain.nodes.length ? plain : null, variant.nodes.length ? variant : null]
}

/** The package stylesheet with its utilities moved to the two layers above. */
export function layerUtilities(css) {
  const root = postcss.parse(css)
  root.walkAtRules("layer", (layer) => {
    if (layer.params.trim() !== "utilities" || !layer.nodes || layer.parent !== root) return
    const plain = postcss.atRule({ name: "layer", params: PLAIN_LAYER })
    const variants = postcss.atRule({ name: "layer", params: VARIANT_LAYER })
    for (const child of layer.nodes) {
      const [p, v] = split(child)
      if (p) plain.append(p.clone())
      if (v) variants.append(v.clone())
    }
    layer.removeAll()
    if (plain.nodes.length) layer.append(plain)
    if (variants.nodes.length) layer.after(variants)
  })
  return root.toString()
}
