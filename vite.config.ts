import { copyFileSync } from "node:fs"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import dts from "vite-plugin-dts"

import { isExternal } from "./scripts/lib/externals.mjs"

// A stylesheet a consumer imports by its own subpath and that no entry pulls.
//
// Only bento's, and for a reason worth keeping: nothing in `src/bento` imports
// `bento.css`, so a consumer taking the layout maths carries no CSS at all.
// That also means the build emits nothing for it — there is no module graph to
// find it through — so it is copied verbatim.
//
// `floating-formulas-bg.css` used to be here too and is not: its component
// imports it, so `cssCodeSplit` emits it per entry. Merged, it was inside
// `./styles` for every consumer (VDS45).
const STANDALONE_CSS: Array<[from: string, to: string]> = [
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
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        // The second era of chrome, deliberately not in the root barrel.
        bento: resolve(__dirname, "src/bento/index.ts"),
        i18n: resolve(__dirname, "src/i18n/index.ts"),
        // The product logos. Their own entry because library mode inlines
        // every asset, so a root re-export shipped 1.90 MB of base64 PNG to
        // every consumer — see VDS40.
        assets: resolve(__dirname, "src/assets/products/index.ts"),
        router: resolve(__dirname, "src/router.ts"),
        vite: resolve(__dirname, "src/vite/index.ts"),
        "floating-formulas-bg": resolve(
          __dirname,
          "src/components/ui/floating-formulas-bg.tsx",
        ),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "es" : "cjs"}.js`,
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
      },
    },
    // Split per entry. Merged, every entry's CSS landed in one file, so
    // floating-formulas-bg.css — a component deliberately behind its own
    // subpath and absent from the root barrel — shipped inside ./styles to
    // every consumer (VDS45).
    //
    // The main entry's stylesheet is `index.css` under splitting; `lib.cssFileName`
    // only applies to a single-entry build, so `./styles` names that path instead.
    // No consumer deep-imports the file, so the subpath is the whole contract.
    cssCodeSplit: true,
  },
})
