import js from "@eslint/js"
import { globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config([
  globalIgnores([
    "dist",
    "storybook-static",
    "node_modules",
    // Vendored to work around a dual-package hazard; not ours to lint.
    "src/shims",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      // v7 keeps the eslintrc shapes at the top level; the flat namespace is
      // the one whose `plugins` is an object.
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // A component file that also exports its cva variants is the pattern the
      // whole package uses, and consumers import those. Warn-only elsewhere.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Left a warning when VDS28 promoted the compiler-era rules, and it spent
      // that time reporting a real stale memo in an exported hook while lint
      // exited 0. A dependency array this rule disagrees with is a defect, so
      // the next one stops the gate instead of adding a line to its output.
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    // Stories and tests are authored, not shipped: they render on purpose and
    // hold deliberately loose fixtures.
    files: ["**/*.stories.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}", "src/test/**"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["*.config.{ts,js}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.node,
    },
  },
])
