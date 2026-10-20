/**
 * What the library build leaves for the consumer to supply.
 *
 * Shared by `vite.config.ts` and `scripts/check-size.mjs` because the two were
 * restating it and disagreeing: the size fixture externalised four packages
 * where the build externalises twenty-four, so `xlsx` — 467 KB, and not in
 * `dist` at all — was measured as this package's weight. Two consequences, both
 * bad: `size-budget.json` did not say what this package costs, and a Dependabot
 * bump to any externalised package moved the baseline enough to fail a build
 * for a reason unrelated to the change (VDS43, and the shape of VDS29).
 *
 * A module rather than a list of strings, because some entries are prefixes:
 * `@radix-ui/react-select` and `date-fns/locale/pt-BR` are both externals and
 * neither is spelled here.
 */

/** Peer dependencies and framework runtime — a consumer already has these. */
export const PEER_EXTERNALS = [
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
  // A peer since VDS211: every release with the parser fixes is served only from
  // SheetJS's CDN, and pnpm refuses a URL subdependency, so the consumer has to
  // be the one that declares it. Required, not optional — the root entry exports
  // `exportToXlsx`, and a Vite build fails on an import it cannot resolve even
  // when nothing calls it.
  "xlsx",
  // The `./vite` plugin entry imports types/runtime from Vite itself.
  "vite",
  // VDS215 — `renderOgCard` in `./vite` rasterises with it. An optional peer,
  // imported only when the helper is called, so a site that draws no card
  // installs no native binary.
  "@resvg/resvg-js",
]

/**
 * Exact ids beyond the peers.
 *
 * Heavy trees a consumer should tree-shake alongside its own usage rather than
 * receive whole: without this the bundle inlines the union of every Radix
 * component and every icon used internally, about 2 MB on every page.
 *
 * Note: `lucide-react` stays bundled — this package uses it internally and a
 * consumer does not need it as a direct dependency.
 */
export const EXACT_EXTERNALS = [
  "@tabler/icons-react",
  "@iconify/react",
  "@tanstack/react-table",
  "react-resizable-panels",
  "vaul",
  "date-fns",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "axios",
  "radix-ui",
]

/** Package roots whose every subpath is external too. */
export const PREFIX_EXTERNALS = [
  "@radix-ui/",
  "@tabler/icons-react/",
  "@iconify/react/",
  "@dnd-kit/",
  "date-fns/",
  // VDS215 — Node's builtins, which the `./vite` build helpers run on. Left to
  // the runtime rather than shimmed for a browser they never reach.
  "node:",
]

/** True when the consumer supplies this module rather than this package. */
export function isExternal(id) {
  if (PEER_EXTERNALS.includes(id)) return true
  if (EXACT_EXTERNALS.includes(id)) return true
  return PREFIX_EXTERNALS.some((prefix) => id.startsWith(prefix))
}

/**
 * The same set as a Rollup `external` array, for a bundler that wants a list
 * rather than a predicate. Prefixes become regular expressions, which is the
 * form Rollup accepts beside a bare string.
 */
export const EXTERNAL_PATTERNS = [
  ...PEER_EXTERNALS,
  ...EXACT_EXTERNALS,
  ...PREFIX_EXTERNALS.map((prefix) => new RegExp("^" + prefix.replaceAll(/[.+*?^$()[\]{}|\\]/g, "\\$&"))),
]
