import { resolve } from "node:path"
import react from "@vitejs/plugin-react"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { defineConfig } from "vitest/config"

// Deliberately separate from vite.config.ts: the library build runs
// vite-plugin-dts and tailwind over every entry, and a test run needs none of
// that. Only the two things a component test depends on are repeated here —
// JSX and the module aliases.
// The `use-sync-external-store` aliases exist for the library build only: they
// keep the CJS output ESM-friendly. Storybook imports
// `use-sync-external-store/shim/index.js`, which the alias rewrites to
// `<shim>.js/index.js` and fails to load — the same reason .storybook/main.ts
// strips them in viteFinal. So the story project gets `@` and nothing else.
const sourceAlias = { "@": resolve(import.meta.dirname, "./src") }

const alias = {
  ...sourceAlias,
  "use-sync-external-store/shim/with-selector": resolve(import.meta.dirname, "./src/shims/use-sync-external-store-shim.js"),
  "use-sync-external-store/shim": resolve(import.meta.dirname, "./src/shims/use-sync-external-store-shim.js"),
  "use-sync-external-store/with-selector.js": resolve(import.meta.dirname, "./src/shims/use-sync-external-store-shim.js"),
  "use-sync-external-store/with-selector": resolve(import.meta.dirname, "./src/shims/use-sync-external-store-shim.js"),
}

export default defineConfig({
  test: {
    projects: [
      // Unit tests, in jsdom. Fast, and where a component's behaviour is
      // asserted directly.
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "unit",
          environment: "jsdom",
          globals: false,
          setupFiles: ["./src/test/setup.ts"],
          include: [
            "src/**/*.{test,spec}.{ts,tsx}",
            // The scripts are shipped machinery too: check-duplicates runs in
            // three products' CI, and check-dist gates every publish.
            "scripts/**/*.{test,spec}.{ts,tsx}",
          ],
          css: false,
          restoreMocks: true,
        },
      },
      // VDS6 — every story rendered in a real browser and checked by axe. The
      // accessibility rules this package inherits are about focus, contrast and
      // the accessibility tree, none of which jsdom models, so the gate has to
      // run somewhere that lays the page out.
      {
        plugins: [
          storybookTest({ configDir: resolve(import.meta.dirname, ".storybook") }),
        ],
        resolve: { alias: sourceAlias },
        // Storybook's test utilities reach @testing-library/dom and its CJS
        // dependencies through a pre-built bundle, so Vite never scans them and
        // serves them raw — the browser then rejects each one's named exports in
        // turn (`elementRoles`, then `default`). Naming the chain forces the
        // CJS-to-ESM pre-bundle for all of it at once.
        optimizeDeps: {
          include: [
            "@testing-library/dom",
            "aria-query",
            "dom-accessibility-api",
            "lz-string",
            "pretty-format",
          ],
        },
        test: {
          name: "stories",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
          setupFiles: [".storybook/vitest.setup.ts"],
        },
      },
    ],
  },
})
