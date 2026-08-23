import { copyFileSync } from "node:fs"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import dts from "vite-plugin-dts"

import { isExternal } from "./scripts/lib/externals.mjs"

// Stylesheets a consumer imports by their own subpath, rather than through the
// bundle. They are copied verbatim so the entry point in the exports map is the
// file itself, and `sideEffects` keeps them.
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
    cssCodeSplit: false,
  },
})
