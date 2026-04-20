import { resolve } from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

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
