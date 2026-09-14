# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS159** (deps: —) **AdaptiveSectionCard silently drops any child that is not its Header or its Content** — A footer, a banner or a second Content renders nothing with no warning, and losing fields is the failure hardest to catch in review. → §VDS159
- 📋 **VDS160** (deps: —) **check-readme covers a name by prefix, so a component whose name extends a listed one passes unlisted** — Button covers a ButtonGroup nobody wrote down, which is the omission the gate was built to catch. → §VDS160
- 📋 **VDS161** (deps: —) **the README inventory covers one published entry of seven, and no list describes the bento layer** — An author adding ./bento has nowhere that answers what is in it, and a component added there is named where no gate reads. → §VDS161

## Block F — What a consuming CMS needs from the package next

## Block G — The package knows one chrome

## Done when — VDS159

- **A child the adapter does not claim still renders inside the frosted section** A
  sibling that is neither Header, StaticHeader nor Content appears in the output in
  source order, asserted beside the recognised shape rather than instead of it.

## Done when — VDS160

- **A component in its own module is never covered by another name's prefix**
  check-readme reads each value's declaring module, so a ButtonGroup beside Button in
  the lists is a finding until it is listed.

## Done when — VDS161

- **Every entry that ships a component vocabulary has a list a gate reads** check-readme
  holds ./bento to its own list the way it holds the root entry, and a component added
  there fails the build until it is named.

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
