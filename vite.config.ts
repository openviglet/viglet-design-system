import { copyFileSync } from "node:fs"
import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"
import dts from "vite-plugin-dts"

const copyStandaloneCss = (): Plugin => ({
  name: "copy-standalone-css",
  writeBundle() {
    copyFileSync(
      resolve(__dirname, "src/components/ui/floating-formulas-bg.css"),
      resolve(__dirname, "dist/floating-formulas-bg.css"),
    )
  },
})

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: "./tsconfig.app.json",
      rollupTypes: false,
      outDir: "dist",
      entryRoot: "src",
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
        i18n: resolve(__dirname, "src/i18n/index.ts"),
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
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react-router-dom",
        "i18next",
        "i18next-browser-languagedetector",
        "react-i18next",
        "react-hook-form",
        "sonner",
        "next-themes",
        // The `./vite` plugin entry imports types/runtime from Vite itself.
        // Mark it external so the bundle doesn't try to pull Vite into the
        // shipped lib.
        "vite",
      ],
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
