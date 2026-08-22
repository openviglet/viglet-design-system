# Roadmap (active backlog)

## Block A — The gate the design system never had

- ⏳ **VDS5** (deps: VDS2 ✅, a 2026.3.3 release to npm) **the package states nowhere what it exports, so a duplicate in a consumer is found only by reading** — Both consumers pin ^2026.3.2, the newest on npm, and the CLI exists only in an unpublished build. → §VDS5
- 📋 **VDS30** (deps: typescript-eslint supporting TS 7) **TypeScript is held at 6 because typescript-eslint refuses to load against 7, so lint and compiler cannot both be current** — It throws on import against ts.versionMajorMinor >= 7, and no side-by-side recipe makes a peer resolve a second TypeScript. → §VDS30

## Block B — Bento becomes a design-system layer

- ⏳ **VDS18** (deps: VDS1 ✅, VDS11 ✅) **twelve RTL suites guard the bento scaffold from inside turing-app and cannot follow the components** — Turing still holds its own copies of the eight moved suites; deleting them is part of its cutover, which needs a release first. → §VDS18
- 📋 **VDS21** (deps: VDS16 ✅) **bento chrome strings live in one product's locale bundle, so a shared rail and palette render raw keys elsewhere** — This package already ships EN and PT base translations, and chrome it owns should carry its own. → §VDS21
- 📋 **VDS22** (deps: VDS11 ✅) **the adapter that renders one form as console cards or as bento sections is a product-local override** — It is what lets a heavy shared form migrate without duplicating its field logic, and both products need it. → §VDS22
- 📋 **VDS36** (deps: —) **the pulse glow hardcodes an indigo rgba, so a shared animation carries a colour the product cannot re-key** — VDS9 made every tone a token and this one kept its literal, which is the same failure in the place a token check does not look. → §VDS36
- 📋 **VDS37** (deps: —) **the bento subpath needs react-router-dom, which the manifest calls an optional peer, so a missing one fails at runtime** — The root entry keeps router components behind /router for exactly this, and the bento layer mixes the two conventions. → §VDS37
- 📋 **VDS38** (deps: —) **the command palette matches an entry's title only, so searching a word from its description finds nothing** — A launcher that misses the words a reader remembers sends them back to the nav they opened it to avoid. → §VDS38

## Block C — One look across products

- 📋 **VDS23** (deps: —) **the product hue is hardcoded per product: Shio orange in a page header, Turing blue in a glass tint** — One look across products does not mean one colour, and today the difference is spelled in class names, not tokens. → §VDS23
- 📋 **VDS24** (deps: VDS16 ✅) **the package exports both eras of chrome and says nowhere which one a new page should use** — PageHeader, SubPage, GridList and InternalSidebar are the console, and a new page will pick one at random. → §VDS24
- 📋 **VDS25** (deps: VDS2 ✅, VDS11 ✅) **nothing proves two products composing the same shared components actually render the same** — One look is the whole goal, and it is judged today by opening two browsers side by side. → §VDS25
- 📋 **VDS26** (deps: VDS8 ✅) **no size budget: a consumer importing nothing from the bento subpath cannot be shown it paid nothing** — The subpath was chosen over one barrel for exactly this, and the choice is so far unmeasured. → §VDS26
- 📋 **VDS31** (deps: —) **Dumont consumes this package and appears nowhere in the plan, so one-look claims are checked against two of three** — The local-dev command found a third 2026.3 consumer on disk, and a design system that plans for two of its three consoles will diverge on the third. → §VDS31

## Done when — VDS5

- **A consumer that re-declares an exported component fails its own build** The export
  list ships as a build artefact, and the lint names the import that replaces the local
  copy rather than only reporting that a duplicate exists.

## Done when — VDS18

- **Every moved component's suite runs here and passes** The suites for the shared
  components live beside them, the product-specific ones stayed behind, and no suite in
  either repository asserts a re-export.

## Done when — VDS21

- **Chrome imported into a new product renders words, not keys** The palette, rail,
  shortcuts dialog and save bar strings ship in English and Portuguese from this
  package, each with an object-form default.

## Done when — VDS22

- **One form renders in either chrome without duplicating a field** The chrome provider
  is exported, a single form of section cards renders as console cards or as frosted
  sections, and the console branch still works.

## Done when — VDS23

- **A product sets its colour once, at the root** Brand accent is a token from which the
  tint, the ring and the gradient stops derive, and a grep finds no product hue
  hardcoded inside a shared component.

## Done when — VDS24

- **Every console-era export says it is the console era** The deprecation is in the doc
  comments and the README, the swap table is published, and nothing is removed while a
  product still renders it.

## Done when — VDS25

- **Two products rendering the same components differ only by token** The digest runs in
  CI over a hero, a form section, an entity tile and a mosaic under each token set, and
  names the exception when there is one.

## Done when — VDS26

- **A root-only consumer contains no bento module and no bento CSS** A fixture importing
  only the root entry is asserted clean in CI, and the bento subpath carries a recorded
  size baseline of its own.

## Done when — VDS36

- **No colour literal survives in the bento stylesheet's own rules** The pulse glow
  reads a token, the check that catches Tailwind class names also catches a raw rgba or
  hex in src/bento, and the glow still renders the same by default.

## Done when — VDS37

- **A consumer learns about the router requirement before runtime** The manifest, the
  README and the subpath's doc comment agree on whether react-router-dom is required for
  the bento entry, and a fixture without it either installs with a warning or imports
  cleanly.

## Done when — VDS38

- **A word from the description finds its entry** Typing a description word returns that
  entry, the title still ranks first when both match, and the test that pins title-only
  matching is replaced rather than deleted.

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
- **Do not remove the console-era exports before both products cut over** PageHeader,
  SubPage, GridList and InternalSidebar still render live screens in both consoles;
  VDS24 deprecates them, and removal is a separate decision with its own line.
- **No product data in the package** Routes, entity names and nav surfaces belong to the
  product; the package exports the palette and the schema, never the array, or a Shio
  console ends up offering Turing routes.
- **Do not make bento the only chrome this package knows** Shio migrates behind a
  parallel route and will render both chromes for the length of that migration, so a
  shared form must be able to say which one it is in.
