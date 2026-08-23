# Roadmap (active backlog)

## Block A — The gate the design system never had

- ⏳ **VDS5** (deps: VDS2 ✅, a 2026.3.3 release to npm) **the package states nowhere what it exports, so a duplicate in a consumer is found only by reading** — All three consumers pin ^2026.3.2, the newest on npm, and the CLI exists only in an unpublished build. → §VDS5
- 📋 **VDS30** (deps: typescript-eslint supporting TS 7) **TypeScript is held at 6 because typescript-eslint refuses to load against 7, so lint and compiler cannot both be current** — It throws on import against ts.versionMajorMinor >= 7, and no side-by-side recipe makes a peer resolve a second TypeScript. → §VDS30

## Block B — Bento becomes a design-system layer

- ⏳ **VDS18** (deps: VDS1 ✅, VDS11 ✅, a 2026.3.3 release to npm) **twelve RTL suites guard the bento scaffold from inside turing-app and cannot follow the components** — The product cannot import from here until a release, so its copies stay until that cutover. → §VDS18

## Block C — One look across products

- 📋 **VDS73** (deps: —) **consumers.json declares three Vite SPAs, so the two Next installs are counted by no guard and no parity digest** — The file's own note makes membership what the guards read, so a consumer absent from it is one every one-look claim skips. → §VDS73

## Block D — The package in a server-rendered framework

- 📋 **VDS71** (deps: —) **the published build carries no use client directive, so a React Server Components consumer fails on the first hook** — Two Next consumers already work around it in their own repositories, and only this build knows which modules are interactive. → §VDS71
- 📋 **VDS72** (deps: —) **ThemeProvider reads localStorage in a useState initialiser, so it throws on any server render** — The package's own Toaster already reads next-themes, so a consumer mounting both runs two theme sources that agree only by luck. → §VDS72

## Done when — VDS5

- **A consumer that re-declares an exported component fails its own build** The export
  list ships as a build artefact, and the lint names the import that replaces the local
  copy rather than only reporting that a duplicate exists.

## Done when — VDS18

- **Every moved component's suite runs here and passes** The suites for the shared
  components live beside them, the product-specific ones stayed behind, and no suite in
  either repository asserts a re-export.

## Done when — VDS71

- **A server component can import the package and build** A Next App Router route
  renders an exported component with no use client of the consumer's own, and next build
  succeeds.

## Done when — VDS72

- **ThemeProvider renders on a server without throwing** One theme source drives the
  class, a consumer that mounts only next-themes still themes correctly, and useTheme
  keeps its shape for the three consoles.

## Done when — VDS73

- **Every install of this package is an entry in consumers.json** The two Next consumers
  are listed with the entries they actually take, and the prose guard fails a paragraph
  that names only the SPAs.

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
