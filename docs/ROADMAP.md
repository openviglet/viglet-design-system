# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS75** (deps: —) **the back-link eyebrow's arrow rule is about two components here and still lives in Turing's file** — It is the last thing that file says this contract does not state, so section 6 stays maintained rather than deleted. → §VDS75
- 📋 **VDS77** (deps: —) **react-hook-form is a dependency, so a consumer can get a second copy of the one library here carrying a context** — Two consumers declare no react-hook-form and get it from here, so the peer change is theirs first. → §VDS77
- 📋 **VDS94** (deps: —) **a product with its own common namespace loses every string the package ships under it, and reads English** — initVigI18n spreads the product's bundle over the package's one namespace at a time, and registerVigTranslations skips any namespace the host already has. → §VDS94
- 📋 **VDS95** (deps: VDS94) **the LanguageSwitcher names itself with a key no locale ships, so its button says Change language in every product** — VDS51 files language.toggle beside the product nouns it leaves to consumers, though here the package's own switcher is naming itself. → §VDS95
- 📋 **VDS96** (deps: —) **the boot loader names its status region Loading in English, before any bundle can say otherwise** — It is HTML the plugin writes at build time, its options take no word for loading, and the VDS93 gate reads JSX and never sees it. → §VDS96

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
