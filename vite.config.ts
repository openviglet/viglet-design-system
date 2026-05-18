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
      outDirs: "dist",
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
      external: (id) => {
        // Hard-coded externals (peer deps + framework runtime).
        const fixed = [
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
          "vite",
        ];
        if (fixed.includes(id)) return true;
        // Externalise heavy UI/icon trees so consumers tree-shake them
        // alongside their own usage. Without this, the DS bundle inlines
        // the union of every Radix component and every Tabler icon used
        // internally — which alone weighs ~2MB and ships on every page.
        if (id.startsWith("@radix-ui/")) return true;
        if (id === "@tabler/icons-react" || id.startsWith("@tabler/icons-react/")) return true;
        if (id === "@iconify/react" || id.startsWith("@iconify/react/")) return true;
        // Externalise xlsx (~900KB + ~1MB of codepages) — only the few admin
        // pages that export reports actually need it. Consumers must declare
        // xlsx as a dep so their bundler can lazy-load it with the route.
        if (id === "xlsx") return true;
        // Note: lucide-react stays bundled — DS uses it internally and
        // consumers don't need it as a direct dep.
        if (id === "@tanstack/react-table") return true;
        if (id === "react-resizable-panels") return true;
        if (id === "vaul") return true;
        if (id === "date-fns" || id.startsWith("date-fns/")) return true;
        if (id === "class-variance-authority" || id === "clsx" || id === "tailwind-merge") return true;
        if (id === "axios") return true;
        if (id === "radix-ui") return true;
        return false;
      },
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
