# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS162** (deps: —) **two parity tests went red together in one full run and nothing kept the message** — Both pass alone and the suite is green seven runs of eight, so the browser stalling reads as two unrelated regressions nobody can act on. → §VDS162

## Block F — What a consuming CMS needs from the package next

## Block G — The package knows one chrome

## Done when — VDS162

- **A red parity run says which wait expired** The failure output of a parity test
  survives the run that produced it, so a stall is read as a stall rather than as two
  regressions.

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
