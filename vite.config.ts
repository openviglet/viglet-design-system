import { copyFileSync } from "node:fs"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import dts from "vite-plugin-dts"

import { CLIENT_ENTRIES, ENTRIES } from "./scripts/lib/entries.mjs"
import { isExternal } from "./scripts/lib/externals.mjs"

// Stylesheets a consumer imports by their own subpath, copied verbatim so the
// entry in the exports map is the file itself.
//
// Both are also reachable other ways, and that is fine rather than a leak.
// `bento.css` is imported by nothing in `src/bento`, on purpose — a consumer
// taking only the layout maths carries no CSS — so the build emits nothing for
// it and the copy is the only way it ships. `floating-formulas-bg.css` is
// imported by its component, which `Login` and `StartupFirst` render, so its
// rules are inside `./styles` too; the subpath is for a consumer who wants only
// that background.
const STANDALONE_CSS: Array<[from: string, to: string]> = [
  ["src/components/ui/floating-formulas-bg.css", "dist/floating-formulas-bg.css"],
  ["src/bento/bento.css", "dist/bento.css"],
]

const copyStandaloneCss = (): Plugin => ({
  name: "copy-standalone-css",
  writeBundle() {
    for (const [from, to] of STANDALONE_CSS) {
      copyFileSync(resolve(__dirname, from), resolve(__dirname, to))
    }
  },
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: "./tsconfig.app.json",
      outDirs: "dist",
      entryRoot: "src",
      // Tests are type-checked by `tsc -b` but are not part of the published
      // surface; without this they emit .d.ts files into dist.
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/test/**"],
    }),
    copyStandaloneCss(),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "use-sync-external-store/shim/with-selector": resolve(__dirname, "./src/shims/use-sync-external-store-shim.js"),
      "use-sync-external-store/shim": resolve(__dirname, "./src/shims/use-sync-external-store-shim.js"),
      "use-sync-external-store/with-selector.js": resolve(__dirname, "./src/shims/use-sync-external-store-shim.js"),
      "use-sync-external-store/with-selector": resolve(__dirname, "./src/shims/use-sync-external-store-shim.js"),
    },
  },
  build: {
    lib: {
      // VDS120 — read from `scripts/lib/entries.mjs`, which is also what
      // `check-dist` reads. An entry therefore cannot exist without a row
      // there, and a row there says which side of the RSC boundary it is on and
      // whether it may reach the router. The lists used to be restated per file
      // and were free to disagree; each entry's own comment lives beside its row.
      entry: Object.fromEntries(
        Object.entries(ENTRIES).map(([name, { source }]) => [name, resolve(__dirname, source)]),
      ),
      formats: ["es", "cjs"],
      // `.cjs`, not `.cjs.js`. package.json declares "type": "module", so Node
      // reads any `.js` as ESM — and these are real CommonJS, so every
      // require() of this package failed with "exports is not defined in ES
      // module scope" (VDS50). The chunks were already `.cjs`; only the entry
      // files carried the extra extension.
      fileName: (format, entryName) =>
        format === "es" ? `${entryName}.es.js` : `${entryName}.cjs`,
    },
    rollupOptions: {
      // Shared with scripts/check-size.mjs so the two cannot disagree about
      // what a consumer supplies — they did, and the size baseline counted
      // 467KB of xlsx that is not in dist at all (VDS43).
      external: isExternal,
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react/jsx-runtime": "jsxRuntime",
          "react-router-dom": "ReactRouterDOM",
        },
        // VDS71 — the directive the three Vite consumers never needed. Vite
        // serves the whole tree as client code, so its absence cost nothing;
        // under React Server Components a module without it *is* a server
        // module, and the App Router fails the build on the first hook it
        // reaches. Two Next consumers were each paying for that in their own
        // repository, one gating its whole tree behind an effect and one
        // re-exporting this package through a module that carries the
        // directive for it.
        //
        // Per entry rather than on every chunk, because two of the seven are
        // genuinely server-safe and marking them would take that away:
        // `./vite` is a build-time plugin that runs in Node, and `./assets` is
        // logo data. The other five reach React state, context or a browser
        // API — `./i18n` included, which is easy to misread as pure until you
        // see it pull i18next-browser-languagedetector.
        //
        // Only entries need it. The six shared chunks are not in the exports
        // map, so nothing imports them directly, and a client entry makes its
        // whole imported graph client anyway.
        banner: (chunk) =>
          chunk.isEntry && CLIENT_ENTRIES.has(chunk.name) ? '"use client";' : "",
      },
    },
    // Merged, not split per entry.

    // VDS45 split it, on the premise that floating-formulas-bg.css belonged to
    // a component behind its own subpath. It does not: FloatingFormulasBg is
    // exported from src/components/ui/index.ts and rendered by Login and
    // StartupFirst, both in the root barrel. Splitting moved its rules into a
    // file a consumer importing Login has no reason to import, and those two
    // rendered an unstyled background (VDS46).
    //
    // A subpath entry existing is not evidence that a root consumer skips it.
    // ./bento is the one that is genuinely separate, and check-size proves
    // that by looking at what the root bundle actually carries.
    cssCodeSplit: false,
  },
})
