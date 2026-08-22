# Roadmap (active backlog)

## Block A — The gate the design system never had

- ⏳ **VDS5** (deps: VDS2 ✅, a 2026.3.3 release to npm) **the package states nowhere what it exports, so a duplicate in a consumer is found only by reading** — Both consumers pin ^2026.3.2, the newest on npm, and the CLI exists only in an unpublished build. → §VDS5
- 📋 **VDS30** (deps: —) **TypeScript is held at 6 because typescript-eslint refuses to load against 7, so lint and compiler cannot both be current** — The package was on 7 and lint could not run at all; one of the two had to move, and the choice should be revisited rather than forgotten. → §VDS30
- 📋 **VDS35** (deps: —) **use:local copies dist over an installed package without reconciling its deps, so a changed range keeps the old one** — It failed a product build on a dependency the package had already moved off, and the failure read as a defect in the change under test. → §VDS35

## Block B — Bento becomes a design-system layer

- 📋 **VDS7** (deps: —) **no rule says which bento components are the shared layer and which are one product's own tiles** — Activation, quota and no-LLM tiles are Turing's business model, and moving those as chrome would export it. → §VDS7
- 📋 **VDS8** (deps: —) **there is no /bento subpath: one entry, and no place for a second component layer** — Console chrome and bento chrome are two eras, and a single barrel puts both in every consumer's bundle. → §VDS8
- 📋 **VDS9** (deps: —) **a bento tone is a hardcoded Tailwind class string, so a product cannot re-key the tile palette** — Turing is blue and Shio is orange, and a shared component that names its own colours makes one of the two look wrong. → §VDS9
- 📋 **VDS10** (deps: VDS8) **bento.styles.css lives inside one product, so the frosted surface and the hover-lift are not installable** — The animation is what makes a page read as bento, and no other product can reach those 216 lines. → §VDS10
- 📋 **VDS11** (deps: VDS9, VDS10) **BentoHero, BentoFormSection, BentoTile, BentoEntityTile and their siblings exist only inside turing-app** — These are what a page composes, so nothing above them can move until they are importable. → §VDS11
- 📋 **VDS12** (deps: VDS11) **the hero-to-sticky save-bar morph is a rAF loop and a CSS variable wired inside one product** — It is the most distinctive bento behaviour and the one a second console is most likely to hand-roll wrongly. → §VDS12
- 📋 **VDS13** (deps: VDS12) **BentoEntityShell owns inline title editing, the icon picker, the status pill and the delete flow, all product-local** — It is the gold standard a detail page copies, and without it a second product invents a fourth layout. → §VDS13
- 📋 **VDS14** (deps: VDS12) **BentoFormHero, the drop-in that gives an own-hero form the save-bar morph, is not installable** — Without it every form page outside the entity shell hand-wires two halves that then drift apart. → §VDS14
- 📋 **VDS15** (deps: VDS11) **the list mosaic — BentoListPage with its New tile, empty state and drag-reorder — is not installable** — Every product has list screens, and a hand-rolled grid is the fastest way for two consoles to stop matching. → §VDS15
- 📋 **VDS16** (deps: VDS11) **the bento shell chrome (nav rail, user menu, back-to-top) is product-local, so a second product has no shell** — A page can look bento inside a console that does not, which the conventions call the first mistake. → §VDS16
- 📋 **VDS17** (deps: VDS16) **the command palette reads a nav config hardcoding one product's surfaces, so it cannot be shared as it stands** — The palette is generic and its data is not; moving both together would put Turing routes in Shio. → §VDS17
- 📋 **VDS18** (deps: VDS1 ✅, VDS11) **twelve RTL suites guard the bento scaffold from inside turing-app and cannot follow the components** — Tests left behind turn one product's regression into two products' regressions. → §VDS18
- 📋 **VDS19** (deps: VDS4 ✅, VDS11) **no bento component has a story, though every other component here has one** — The catalogue is how an author finds a component instead of rewriting it, and the newest layer is invisible in it. → §VDS19
- 📋 **VDS20** (deps: VDS11) **the bento authoring contract is a CONVENTIONS.md inside one product, addressed to that product** — Two consoles diverge the moment the rules live where only one of them reads them. → §VDS20
- 📋 **VDS21** (deps: VDS16) **bento chrome strings live in one product's locale bundle, so a shared rail and palette render raw keys elsewhere** — This package already ships EN and PT base translations, and chrome it owns should carry its own. → §VDS21
- 📋 **VDS22** (deps: VDS11) **the adapter that renders one form as console cards or as bento sections is a product-local override** — It is what lets a heavy shared form migrate without duplicating its field logic, and both products need it. → §VDS22

## Block C — One look across products

- 📋 **VDS23** (deps: —) **the product hue is hardcoded per product: Shio orange in a page header, Turing blue in a glass tint** — One look across products does not mean one colour, and today the difference is spelled in class names, not tokens. → §VDS23
- 📋 **VDS24** (deps: VDS16) **the package exports both eras of chrome and says nowhere which one a new page should use** — PageHeader, SubPage, GridList and InternalSidebar are the console, and a new page will pick one at random. → §VDS24
- 📋 **VDS25** (deps: VDS2 ✅, VDS11) **nothing proves two products composing the same shared components actually render the same** — One look is the whole goal, and it is judged today by opening two browsers side by side. → §VDS25
- 📋 **VDS26** (deps: VDS8) **no size budget: a consumer importing nothing from the bento subpath cannot be shown it paid nothing** — The subpath was chosen over one barrel for exactly this, and the choice is so far unmeasured. → §VDS26
- 📋 **VDS31** (deps: —) **Dumont consumes this package and appears nowhere in the plan, so one-look claims are checked against two of three** — The local-dev command found a third 2026.3 consumer on disk, and a design system that plans for two of its three consoles will diverge on the third. → §VDS31

## Done when — VDS5

- **A consumer that re-declares an exported component fails its own build** The export
  list ships as a build artefact, and the lint names the import that replaces the local
  copy rather than only reporting that a duplicate exists.

## Done when — VDS7

- **A written boundary says which components are the layer** Each of the 23 bento
  components is classified as shared or product, the four commercial tiles are named as
  product, and the first-run tour is decided either way.

## Done when — VDS8

- **The subpath resolves with its own types and stylesheet** The bento entry and its CSS
  both import cleanly in a consumer, sideEffects keeps the stylesheet, and the root
  entry is unchanged.

## Done when — VDS9

- **A tone is re-keyed by redefining variables, not by forking a component** Every tone
  is CSS custom properties in the preset, in the OKLCH system the other tokens use, and
  no shared component names a Tailwind colour class.

## Done when — VDS10

- **Importing the bento stylesheet is enough to get the surface and the lift** No
  consumer copies a class; the tile, glass, grid and header animations all render, and
  every one of them is disabled under prefers-reduced-motion.

## Done when — VDS11

- **The nine leaf components import from the subpath** Hero, form section, tile, entity
  tile, section, count tile, empty state, status marker and actions menu all resolve
  from the package with their props unchanged.

## Done when — VDS12

- **The save-bar morph works in a consumer that wrote none of it** The scroll-fade hook
  and both bars come from the package, the fade is driven by the custom property, and
  scrolling a page produces no React re-render.

## Done when — VDS13

- **A detail page costs one call and carries no shell mechanics** The entity shell, the
  inline edit and the icon picker are exported, the render-prop contract is unchanged,
  and a consuming page compiles on the import alone.

## Done when — VDS14

- **An own-hero form gets the morph from one component** BentoFormHero renders both
  halves itself, the imperative actions escape hatch is intact, and no page composes a
  fade-out bar and a scroll bar separately.

## Done when — VDS15

- **A list screen is one call with a renderTile** The mosaic, the New tile, the empty
  state, the error path, per-item emphasis and drag reorder all come from the package,
  with spans in multiples of two.

## Done when — VDS16

- **A consumer gets a shell with no sidebar provider** The rail, the user menu and the
  back-to-top are exported with the layout that reserves the rail gutter, and the
  no-sidebar rule is stated where a consumer meets it.

## Done when — VDS17

- **The palette works against a product-supplied array** The package exports the
  palette, the shortcuts dialog and the entry schema; no route or surface of either
  product is in it, and the rail reads the same array.

## Done when — VDS18

- **Every moved component's suite runs here and passes** The suites for the shared
  components live beside them, the product-specific ones stayed behind, and no suite in
  either repository asserts a re-export.

## Done when — VDS19

- **Every bento component has a story with its tone variants** The mosaic story shows
  both the populated and the empty state, and one story scrolls far enough for the
  save-bar morph to be visible in it.

## Done when — VDS20

- **The authoring contract is product-neutral and lives here** The three page shapes,
  the save-bar rule, the identity-in-the-hero rule, the grid spans and the i18n and
  accessibility baselines are written without naming a product.

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

## Done when — VDS35

- **A dependency the push cannot reconcile is named before the copy** Running use:local
  after a dependency range changes reports the packages whose installed version no
  longer satisfies it, and says what to run in the product, rather than leaving a build
  to fail on it later.

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
