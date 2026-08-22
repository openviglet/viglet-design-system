# Shipped Ledger

## Block A — The gate the design system never had

- ✅ **VDS1** **no test runner: zero test files and no vitest, so a shared component cannot carry a regression test** — vitest, jsdom and Testing Library run six passing Button assertions, and the CI workflow fails when the suite goes red.
- ✅ **VDS2** **nothing builds, lints or tests on a push; the only workflow publishes on manual dispatch** — One CI workflow runs install, lint, tsc, vitest, build and the catalogue build on every push and pull request; a deliberately broken commit exits 2 before it can reach npm.
- ✅ **VDS3** **both copy-ds.cmd scripts target directories that no longer exist, so there is no local-dev path** — pnpm use:local resolves the consumers from their package.json and the install path from the link their own package manager made, and both Shio and Turing build against this checkout.
- ✅ **VDS4** **the component catalogue is built into storybook-static and published nowhere a product author can open** — The Pages workflow turns Pages on for itself and deploys the catalogue on every 2026.3 commit, so the README link goes live with the first one.
- ✅ **VDS5 (instrument half)** **the package states nowhere what it exports, so a duplicate in a consumer is found only by reading** — dist/exports.json records 274 exports across five entry points, and viglet-ds-check-duplicates names the import that replaces each local copy.
- ✅ **VDS32** **the package manager was npm while all three consumers are pnpm workspaces, and pnpm's layout broke the published types** — The repository is on pnpm 11.8.0 with a hoisted linker, and scripts/check-dist.mjs fails the build when a declaration imports through node_modules.
- ✅ **VDS6** **the storybook a11y addon is installed and never run, so no accessibility rule is enforced** — All 222 stories run in Chromium under axe and pass; the forty violations they exposed are fixed, and a new one fails CI.
- ✅ **VDS27** **nine explicit any in the console-era router components, so the lint that guards them is a warning nobody fails on** — The nine sites carry real types, the tenth behind an eslint-disable went with them, and no-explicit-any is an error again.
- ✅ **VDS33** **building the catalogue rewrites dist/*.d.ts through node_modules paths, so build then catalogue ships broken types** — The catalogue build drops the declaration plugin, so dist is byte-identical across it, and CI re-checks dist after the catalogue.

## Block B — Bento becomes a design-system layer

## Block C — One look across products
