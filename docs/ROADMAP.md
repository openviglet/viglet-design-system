# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS77** (deps: —) **react-hook-form is a dependency, so a consumer can get a second copy of the one library here carrying a context** — Two consumers declare no react-hook-form and get it from here, so the peer change is theirs first. → §VDS77
- 📋 **VDS94** (deps: —) **a product with its own common namespace loses every string the package ships under it, and reads English** — initVigI18n spreads the product's bundle over the package's one namespace at a time, and registerVigTranslations skips any namespace the host already has. → §VDS94
- 📋 **VDS95** (deps: VDS94) **the LanguageSwitcher names itself with a key no locale ships, so its button says Change language in every product** — VDS51 files language.toggle beside the product nouns it leaves to consumers, though here the package's own switcher is naming itself. → §VDS95
- 📋 **VDS96** (deps: —) **the boot loader names its status region Loading in English, before any bundle can say otherwise** — It is HTML the plugin writes at build time, its options take no word for loading, and the VDS93 gate reads JSX and never sees it. → §VDS96
- 📋 **VDS97** (deps: —) **the Toaster region keeps sonner's English name, Notifications, because the package passes it no label** — The English is a dependency default rather than a literal here, so VDS93 cannot see it, and a screen reader says it in every product. → §VDS97
- 📋 **VDS98** (deps: VDS93 ✅) **Stepper.Completion and AppSwitcher still speak English through prop defaults, which the literals gate never reads** — The gate reads JSX text and spoken attributes and follows no identifier back to its parameter default, so VDS93's claim is false in two components. → §VDS98
- 📋 **VDS99** (deps: VDS92 ✅) **the contrast gate passes on an unreadable ground and never measures foreground on background** — A null ground is measured as white and the body-text pair is filtered out, and the grounds canvas still draws the muted value VDS92 replaced. → §VDS99

## Block E — The assistant every product shares

- 📋 **VDS103** (deps: VDS100 ✅) **nothing compares the mascot with the design it was drawn from, so it shipped the wrong colour and over-faceted** — Three defects passed types, lint, 1029 tests, the size budget and axe, and a person holding a screenshot beside the reference is what found all of them. → §VDS103

## Done when — VDS103

- **the avatar draws the same frame twice for the same inputs** the embers derive their
  arrangement instead of seeding from Math.random, the way VDS54 fixed the formulas
  backdrop.
- **a reference image is committed and the test compares against it** the browser
  project renders the avatar at a fixed state with motion frozen and diffs it, so a
  colour or facet-count regression fails the run.

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
