/**
 * VDS216 — the preset's tokens as a stylesheet a browser reads with no build.
 *
 * `preset.css` is written for Tailwind: `@custom-variant` declares the dark
 * variant, `@theme` names the faces, and `@theme inline` maps every token onto a
 * Tailwind colour. A browser ignores all three at-rules, so a plain page that
 * linked the preset would lose `--font-sans` and `--font-brand`, which the site
 * layer reads. This derives `tokens.css` from the preset rather than keeping a
 * second copy, so the two cannot drift: the faces move into `:root`, the
 * Tailwind-only rules go, and every `--vg-*` block, the dark grounds and the
 * tones included, passes through untouched.
 */

const HEADER = `/* =============================================================
   Viglet Design System — tokens for a page with no build (VDS216)
   ---------------------------------------------------------------
   Generated from preset.css by scripts/build-tokens.mjs; edit that.
   The --vg-* properties, the dark ground (.dark or [data-theme="dark"])
   and the tones ([data-tone]). Link it before ./site.css.
   ============================================================= */
`

/** The index just past the `}` closing the block whose `{` is at `open`. */
function blockEnd(css, open) {
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css.startsWith("/*", i)) {
      i = css.indexOf("*/", i + 2) + 1
      if (i === 0) throw new Error("tokens-css: an unterminated comment in the preset")
      continue
    }
    if (css[i] === "{") depth++
    else if (css[i] === "}" && --depth === 0) return i + 1
  }
  throw new Error("tokens-css: an unclosed block in the preset")
}

/** Every `@theme` block, with its prelude and body, in source order. */
function themeBlocks(css) {
  const found = []
  for (const match of css.matchAll(/@theme\b([^{]*)\{/g)) {
    const open = match.index + match[0].length - 1
    const end = blockEnd(css, open)
    found.push({ start: match.index, end, inline: /\binline\b/.test(match[1]), body: css.slice(open + 1, end - 1) })
  }
  return found
}

/** `tokens.css` from the preset's source. */
export function tokensCss(preset) {
  const blocks = themeBlocks(preset)
  if (!blocks.some((b) => !b.inline)) throw new Error("tokens-css: the preset has no @theme block naming the faces")

  let out = ""
  let at = 0
  for (const block of blocks) {
    out += preset.slice(at, block.start)
    // The faces are tokens a page reads; the inline mapping is Tailwind's alone.
    if (!block.inline) out += `:root {${block.body}}`
    at = block.end
  }
  out += preset.slice(at)
  out = out.replace(/^@custom-variant[^;]*;\s*\n?/gm, "")
  // The preset's own header tells a Tailwind consumer how to import it, which
  // is the one thing a reader of this file must not do.
  out = out.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "")
  return HEADER + "\n" + out
}
