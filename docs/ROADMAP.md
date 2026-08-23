# Roadmap (active backlog)

## Block A — The gate the design system never had

- ⏳ **VDS5** (deps: VDS2 ✅, a 2026.3.3 release to npm) **the package states nowhere what it exports, so a duplicate in a consumer is found only by reading** — All three consumers pin ^2026.3.2, the newest on npm, and the CLI exists only in an unpublished build. → §VDS5
- 📋 **VDS30** (deps: typescript-eslint supporting TS 7) **TypeScript is held at 6 because typescript-eslint refuses to load against 7, so lint and compiler cannot both be current** — It throws on import against ts.versionMajorMinor >= 7, and no side-by-side recipe makes a peer resolve a second TypeScript. → §VDS30
- 📋 **VDS52** (deps: —) **useGridAdapter memoizes on data alone while config supplies every extractor, so a changed config yields stale rows** — exhaustive-deps stayed a warning after VDS28, and the naive [data, config] fix defeats the memo for an inline literal. → §VDS52

## Block B — Bento becomes a design-system layer

- ⏳ **VDS18** (deps: VDS1 ✅, VDS11 ✅, a 2026.3.3 release to npm) **twelve RTL suites guard the bento scaffold from inside turing-app and cannot follow the components** — The product cannot import from here until a release, so its copies stay until that cutover. → §VDS18

## Done when — VDS5

- **A consumer that re-declares an exported component fails its own build** The export
  list ships as a build artefact, and the lint names the import that replaces the local
  copy rather than only reporting that a duplicate exists.

## Done when — VDS18

- **Every moved component's suite runs here and passes** The suites for the shared
  components live beside them, the product-specific ones stayed behind, and no suite in
  either repository asserts a re-export.

## Done when — VDS52

- **the memo recomputes when an extractor changes and the rows do not** a test renders
  the hook, swaps the url builder with the same data array, and asserts the returned
  urls changed.
- **a stable config does not defeat the memo** the same test asserts the returned array
  is referentially identical across a re-render with unchanged data and extractors.
- **npm run lint fails on the dependency array it used to warn about** exhaustive-deps
  is an error, so the next wrong memo stops the gate instead of adding a line to its
  output.

## Non-goals

- **Do not fork a shared component inside a product** The one-line re-export shim is the
  pattern both consumers already use; a local copy that drifts is the failure this
  package exists to prevent, and VDS5 makes it fail a build.
- **Do not move a product's commercial chrome into the package** Activation, quota and
  no-LLM tiles are Turing's business model rendered as cards; shipping them here would
  make every product import one product's offer.
- **Do not redesign a bento component while moving it** A move whose diff also changes
  behaviour cannot be reviewed against the 118 pages that already depend on it;
  improvements land as their own lines afterwards.
- **No product data in the package** Routes, entity names and nav surfaces belong to the
  product; the package exports the palette and the schema, never the array, or a Shio
  console ends up offering Turing routes.
- **Do not make bento the only chrome this package knows** Shio migrates behind a
  parallel route and will render both chromes for the length of that migration, so a
  shared form must be able to say which one it is in.
- **Do not remove the console-era exports before every console cuts over** PageHeader,
  SubPage, GridList and InternalSidebar still render live screens in all three; VDS24
  deprecates them, and removal is a separate decision with its own line.
