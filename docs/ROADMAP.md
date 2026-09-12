# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS124** (deps: —) **Nothing in the lint config forbids dangerouslySetInnerHTML, so the next one ships with no gate** — VDS107 removed the only one, and a review caught it rather than a check; the prop takes a consumer's content straight to innerHTML and nothing here reads it. → §VDS124
- 📋 **VDS126** (deps: —) **The resize handle's grip is selected by panel-group-direction, which v4 renamed, so it never rotates** — A vertical handle draws the grip pointing the way a horizontal one drags, and it is the one part of the component that says which way this moves. → §VDS126

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
