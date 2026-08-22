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

      // Debt this gate inherits rather than introduces. Each is a warning so the
      // gate can be green today and still fail on anything new; each has a
      // roadmap line that raises it back to "error" once the count is zero.
      //   VDS28 — the compiler-era hook rules (setState-in-effect, purity)
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
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
