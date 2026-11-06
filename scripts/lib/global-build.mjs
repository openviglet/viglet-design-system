/**
 * VDS237 — the browser build, for a page that loads scripts by URL.
 *
 * Every other output of this package is ESM (or CJS) for a bundler. A design
 * canvas, a static mockup or a page with no build cannot import those, so they
 * redrew every Button by hand. This one file is an IIFE that takes React and
 * ReactDOM from the page's globals and assigns `window.VigletDS`.
 *
 * Read by `vite.global.config.ts` (what to build), `check-dist` (that it was
 * built and imports nothing) and `check-size` (what it weighs), so the three
 * cannot disagree about which file it is.
 *
 * It is deliberately not in the `exports` map: nothing resolves it through
 * Node, a CDN serves it by path (`/dist/viglet-ds.global.js`), and an exports
 * row would have `check-exports` import an IIFE as if it were a module.
 */
export const GLOBAL_BUILD = {
  source: "src/global/index.ts",
  file: "viglet-ds.global.js",
  name: "VigletDS",
  /** The only modules the page supplies, and the globals it supplies them as. */
  globals: { react: "React", "react-dom": "ReactDOM" },
  /**
   * VDS239 — the components it publishes, by family (a family's parts, such as
   * `CardHeader`, ride with it). A design canvas gets one card for each, and the
   * test holds the bundle to this list.
   */
  components: [
    "Button",
    "GradientButton",
    "Badge",
    "BentoStatusMarker",
    "Progress",
    "Input",
    "Textarea",
    "Checkbox",
    "Switch",
    "Card",
    "Tabs",
    "Separator",
    "Avatar",
  ],
}

/**
 * Module loads left in a script that is meant to load none.
 *
 * An IIFE has no module system: a bare `import` is a syntax error in a classic
 * script and a `require` is a ReferenceError the first time it runs. Either one
 * in this file means a dependency was neither bundled nor mapped to a global.
 * Matched as a statement or a call with a string argument, so the words inside
 * an error message do not count.
 */
export function moduleLoads(code) {
  const found = []
  for (const [match] of code.matchAll(/\brequire\s*\(\s*["'`][^"'`]+["'`]\s*\)/g)) found.push(match)
  for (const [match] of code.matchAll(/(?:^|[;}\n])\s*import\s*(?:[\w*{][^;\n]*?\bfrom\s*)?["'][^"']+["']/g)) {
    found.push(match.trim())
  }
  for (const [match] of code.matchAll(/\bimport\s*\(\s*["'`][^"'`]+["'`]\s*\)/g)) found.push(match)
  return found
}
