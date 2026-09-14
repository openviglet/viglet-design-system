# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS165** (deps: —) **the chrome census counts nothing for a console-era name imported under an alias** — Turing imported SubPage as SharedSubPage, the census read zero on the reading VDS147 removed it on, and Turing's build broke on 2026.3.11. → §VDS165
- 📋 **VDS166** (deps: —) **the census test walks nine checkouts under a five-second default and timed out once on a cold disk** — Every assertion held and the next two runs passed, so the census gate reads as flaky while it is only slow. → §VDS166

## Block F — What a consuming CMS needs from the package next

## Done when — VDS165

- **A console-era name imported under an alias counts as taken** A fixture holding only
  an aliased import measures one file, not zero, and the shim-follow case still counts
  its pages.

## Done when — VDS166

- **The register census case is sized for the loaded suite** Its timeout carries a
  comment giving the measured cold and warm walk, and the case passes beside the other
  script tests on a cold disk.

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
