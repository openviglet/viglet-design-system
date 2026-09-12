/**
 * The published entries, and the facts about each one that more than one file
 * needs to know.
 *
 * VDS120 — three lists were restated across two files and free to disagree.
 * `vite.config.ts` held `CLIENT_ENTRIES`, which is what writes the `"use client"`
 * banner; `check-dist.mjs` held an independent copy of it beside
 * `SERVER_ENTRIES`, and `ROUTER_ENTRIES` on top. The check then iterated its own
 * sets rather than the build's entries, so an eighth entry added to the build
 * alone shipped with no banner and the loop never looked at it — VDS71's gate
 * passing on exactly the kind of file it was written to catch, with the failure
 * landing in a Next consumer's build instead. This is the same repair VDS43 made
 * to the externals, one file over.
 *
 * **The build reads this too**, which is the part that makes it hold: an entry
 * cannot exist without a row here, so it cannot exist unclassified.
 *
 * `boundary` is a fact about each entry's contents and cannot be inferred: under
 * RSC a module without `"use client"` *is* a server module, so an entry that
 * reaches a hook fails a consumer's build on the first one, and a directive on
 * an entry that does not — `./vite` runs in Node at build time, `./assets` is
 * logo data — takes away a server component's ability to import it for no gain.
 *
 * `router` says whether the entry may reach `react-router-dom`, which is an
 * optional peer: a consumer told it is optional and handed a chunk that imports
 * it fails to build.
 *
 * @typedef {{ source: string, boundary: "client" | "server", router: boolean }} Entry
 * @type {Record<string, Entry>}
 */
export const ENTRIES = {
  index: { source: "src/index.ts", boundary: "client", router: false },
  // The second era of chrome, deliberately not in the root barrel.
  bento: { source: "src/bento/index.ts", boundary: "client", router: true },
  // Not obvious: pulls i18next-browser-languagedetector, which reads navigator
  // and localStorage.
  i18n: { source: "src/i18n/index.ts", boundary: "client", router: false },
  // The product logos. Their own entry because library mode inlines every
  // asset, so a root re-export shipped 1.90 MB of base64 PNG to every consumer
  // (VDS40). Data, so a server component may import it.
  assets: { source: "src/assets/products/index.ts", boundary: "server", router: false },
  router: { source: "src/router.ts", boundary: "client", router: true },
  // A build-time plugin, which runs in Node.
  vite: { source: "src/vite/index.ts", boundary: "server", router: false },
  "floating-formulas-bg": {
    source: "src/components/ui/floating-formulas-bg.tsx",
    boundary: "client",
    router: false,
  },
}

const named = (predicate) =>
  new Set(Object.entries(ENTRIES).filter(([, entry]) => predicate(entry)).map(([name]) => name))

/** Entries a React Server Components consumer must treat as client code. */
export const CLIENT_ENTRIES = named((entry) => entry.boundary === "client")

/** Entries that stay server-renderable, and must carry no directive. */
export const SERVER_ENTRIES = named((entry) => entry.boundary === "server")

/** Entries allowed to reach `react-router-dom`, which is an optional peer. */
export const ROUTER_ENTRIES = named((entry) => entry.router)

/** The two files the build emits for one entry. */
export const emittedFiles = (name) => [`${name}.es.js`, `${name}.cjs`]
