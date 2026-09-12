# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS77** (deps: cloud-frontend and cloud-console declaring react-hook-form) **react-hook-form is a dependency, so a consumer can get a second copy of the one library here carrying a context** — Two consumers declare no react-hook-form and get it from here, so the peer change is theirs first. → §VDS77

## Block E — The assistant every product shares

- 📋 **VDS106** (deps: VDS103 ✅) **a mascot defect smaller than 2% of the frame passes the reference-image gate, as the ember layer order does** — The three defects VDS103 was built for include one it measures as under budget, so the layer order that put the sparks on top of the sun would ship again unseen. → §VDS106

## Done when — VDS106

- **the embers drawn over the core fail the gate** Put that layer order back and the
  comparison is red; put it right and the suite is green.
- **the core and the space around it are scored apart** Each region carries its own
  budget, derived from the sphere radius rather than measured off the reference.

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
