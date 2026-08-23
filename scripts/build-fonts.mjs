#!/usr/bin/env node
/**
 * VDS44 — build `dist/fonts.css` instead of copying it.
 *
 * It used to ship verbatim, so its `@import "@fontsource-variable/inter"`
 * reached the consumer as a bare specifier and was resolved by whatever their
 * bundler looked at. That worked because all three products use pnpm's hoisted
 * linker, which happens to put this package's dependencies in their tree. It is
 * an unstated dependency, and its failure is the silent kind: a missing
 * `@import` is not an error, the type falls back through `--font-sans` to
 * `system-ui`, and nobody sees it until a screenshot.
 *
 * A Vite entry was tried first and is not available: `cssCodeSplit: false`
 * merges every entry's CSS into one file, so adding a fonts entry put the faces
 * straight back into `./styles`, which is what VDS41 took them out of.
 *
 * So the faces are copied as **files** beside the stylesheet and the `url()`s
 * rewritten to point at them. That is better than inlining, and what VDS41's
 * design asked for: a consumer can cache them apart from the rules, preload
 * them, and serve them from a CDN — none of which base64 in a stylesheet
 * allows.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const require = createRequire(join(root, "package.json"))

/** The families `--font-sans` and `--font-brand` name, in the preset. */
const FAMILIES = ["@fontsource-variable/inter", "@fontsource-variable/plus-jakarta-sans"]

const OUT_CSS = join(root, "dist", "fonts.css")
const OUT_DIR = join(root, "dist", "fonts")

/** The banner a consumer reads if they open the file. */
const BANNER = `/*!
 * Viglet Design System — the brand faces.
 *
 * Inter for UI and Plus Jakarta Sans for display, as \`--font-sans\` and
 * \`--font-brand\` name them in the preset. Self-contained: the woff2 files sit
 * in ./fonts/ beside this stylesheet, so nothing here resolves through your
 * node_modules, and your CDN and browser can cache them apart from the rules.
 *
 *   @import "@viglet/viglet-design-system/styles";
 *   @import "@viglet/viglet-design-system/fonts";
 *
 * Skip it and the type falls back through --font-sans to system-ui, which is a
 * real look rather than a broken one — and the right one if you already serve
 * your own copy of Inter.
 */
`

/**
 * Rewrites one @fontsource stylesheet to point at files beside it, copying
 * each one. Exported so a test can hold the refusal below without a build:
 * shipping a stylesheet whose faces are not there is the failure this exists
 * to prevent, and it is silent.
 */
export function rewriteFaces(css, { onFile }) {
  const copied = new Set()
  const rewritten = css.replaceAll(/url\(\s*(\.\/files\/([^)\s]+))\s*\)/g, (_, relative, file) => {
    onFile(relative.replace(/^\.\//, ""), file)
    copied.add(file)
    return `url(./fonts/${file})`
  })
  return { css: rewritten, files: copied }
}

function familyCss(pkg) {
  // The package's own entry stylesheet, found through its exports map rather
  // than by joining a path — the layout is the package's business, not ours.
  const cssPath = require.resolve(`${pkg}/index.css`)
  const dir = dirname(cssPath)

  const { css, files } = rewriteFaces(readFileSync(cssPath, "utf8"), {
    onFile: (from, to) => copyFileSync(join(dir, from), join(OUT_DIR, to)),
  })

  if (files.size === 0) {
    throw new Error(
      `${pkg}: no url(./files/...) found in ${cssPath} — the package layout changed, ` +
        `and shipping this stylesheet would reference faces that are not there`,
    )
  }
  return { css, files: files.size }
}

function main() {
  rmSync(OUT_DIR, { recursive: true, force: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const parts = [BANNER]
  let files = 0
  for (const pkg of FAMILIES) {
    const family = familyCss(pkg)
    parts.push(`/* ${pkg} */`, family.css)
    files += family.files
  }

  const css = parts.join("\n")
  writeFileSync(OUT_CSS, css)

  const faces = (css.match(/@font-face/g) ?? []).length
  const bytes = readdirSync(OUT_DIR).reduce(
    (n, f) => n + readFileSync(join(OUT_DIR, f)).byteLength,
    0,
  )
  console.log(
    `build-fonts: ${faces} faces, ${files} files (${Math.round(bytes / 1024)}KB) -> dist/fonts.css + dist/fonts/`,
  )
}

// Importable for the tests without writing anything.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
