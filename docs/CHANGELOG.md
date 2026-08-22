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
- ✅ **VDS28** **the compiler-era hook rules fire on three components and are demoted to warnings, so setState-in-effect ships unchecked** — The three call sites use useSyncExternalStore, derived state and a stable id, and both compiler-era hook rules are errors.
- ✅ **VDS29** **react-table is held at v8 because a grouped Dependabot bump to v9 broke grid.list and reached the default branch unbuilt** — A consumer pinned to react-table v8 bundles the v9 package cleanly: pnpm gives each side its own copy, under the hoisting all three products use.
- 🗑 **VDS34** **thirty deps are externalised at build but declared as dependencies, so their major version is an unstated contract** — abandoned: Measured wrong: pnpm gives the package its own copy under both the default and the shamefully-hoist layout, so the major is not a shared contract.
- ✅ **VDS35** **use:local copies dist over an installed package without reconciling its deps, so a changed range keeps the old one** — use:local compares the ranges it is about to copy against what the target resolves, names the packages that do not satisfy them, and refuses.

## Block B — Bento becomes a design-system layer

- ✅ **VDS7** **no rule says which bento components are the shared layer and which are one product's own tiles** — docs/BENTO-BOUNDARY.md classifies all 47 barrel exports as shared or product, names the four commercial ones, and rules the tour product.
- ✅ **VDS8** **there is no /bento subpath: one entry, and no place for a second component layer** — ./bento and ./bento.css resolve in an installed consumer with their own types, and the root entry still exports the same 250 names.
- ✅ **VDS9** **a bento tone is a hardcoded Tailwind class string, so a product cannot re-key the tile palette** — A tone is two OKLCH custom properties in the preset that .bento-chip reads, so re-keying one redefines variables and forks nothing.
- ✅ **VDS10** **bento.styles.css lives inside one product, so the frosted surface and the hover-lift are not installable** — bento.css ships every class and keyframe the product's copy defines, and one guard turns off each of the eight things it animates.
- ✅ **VDS11** **BentoHero, BentoFormSection, BentoTile, BentoEntityTile and their siblings exist only inside turing-app** — All nine leaves plus BentoBackLink resolve from the installed subpath with their props unchanged, and 24 render tests hold them.
- ✅ **VDS12** **the hero-to-sticky save-bar morph is a rAF loop and a CSS variable wired inside one product** — The hook and both bars resolve from the subpath beside the CSS they drive, and scrolling writes the property without a React render.
- ✅ **VDS13** **BentoEntityShell owns inline title editing, the icon picker, the status pill and the delete flow, all product-local** — The shell, inline edit and icon picker resolve from the subpath with the render-prop contract unchanged, over a picker that asks the product for suggestions.

## Block C — One look across products
