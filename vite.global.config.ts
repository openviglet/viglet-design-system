import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

import { GLOBAL_BUILD } from "./scripts/lib/global-build.mjs"

// VDS237 — the browser build: one IIFE assigning `window.VigletDS`, for a page
// that loads scripts by URL. A second pass after `vite build`, because a library
// build emits one set of formats for all its entries and this one wants neither
// the ESM entries' externals nor their declarations.
//
// Everything is bundled except React and ReactDOM, which the page supplies as
// globals: an IIFE has no module system to find anything else with.
const here = import.meta.dirname
const shim = resolve(here, "./src/shims/use-sync-external-store-shim.js")

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(here, "./src"),
      // The page's React makes the elements, whichever major it is.
      "react/jsx-runtime": resolve(here, "./src/global/jsx-runtime.ts"),
      "react/jsx-dev-runtime": resolve(here, "./src/global/jsx-runtime.ts"),
      "use-sync-external-store/shim/with-selector": shim,
      "use-sync-external-store/shim": shim,
      "use-sync-external-store/with-selector.js": shim,
      "use-sync-external-store/with-selector": shim,
    },
  },
  // A library build leaves `process.env.NODE_ENV` for the consumer's bundler to
  // replace. In a classic script there is no bundler and no `process`.
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    // The ESM build has already written dist/; this adds one file beside it.
    emptyOutDir: false,
    lib: {
      entry: resolve(here, GLOBAL_BUILD.source),
      formats: ["iife"],
      name: GLOBAL_BUILD.name,
      fileName: () => GLOBAL_BUILD.file,
    },
    rollupOptions: {
      external: Object.keys(GLOBAL_BUILD.globals),
      output: { globals: GLOBAL_BUILD.globals },
    },
  },
})
