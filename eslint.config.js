import js from "@eslint/js"
import { globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import tseslint from "typescript-eslint"

import setStateInEffectViaCall from "./scripts/eslint/set-state-in-effect-via-call.mjs"

// VDS57 — the project's own rules. One so far, and it exists because the
// upstream rule it extends stops at one level of indirection.
const vds = { rules: { "set-state-in-effect-via-call": setStateInEffectViaCall } }

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
    plugins: { vds },
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
      // VDS68 — off, not warn. This rule keeps Fast Refresh working in an app,
      // and a published component library cannot satisfy it: all three of the
      // shapes it reports are this package's intended API. A file exporting its
      // cva variants beside the component (`buttonVariants`), a provider
      // exporting its hook (`useUser`), and a compound component assembled with
      // Object.assign (`Login`, `GridList`) are what consumers import. Held at
      // warn it reported 58 of them every run — a floor that never fell and hid
      // two dead eslint-disable directives for as long as it stood. A rule that
      // can only ever be wrong here buys nothing and costs the gate, so lint now
      // runs at --max-warnings 0 and this one is silent by decision.
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Left a warning when VDS28 promoted the compiler-era rules, and it spent
      // that time reporting a real stale memo in an exported hook while lint
      // exited 0. A dependency array this rule disagrees with is a defect, so
      // the next one stops the gate instead of adding a line to its output.
      "react-hooks/exhaustive-deps": "error",
      // VDS57 — see the rule. Upstream's set-state-in-effect covers the direct
      // call; this covers the same defect written behind a name, which is the
      // form a listener forces you into and the one it had always passed.
      "vds/set-state-in-effect-via-call": "error",
    },
  },
  {
    files: ["*.config.{ts,js}", ".storybook/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.node,
    },
  },
])
