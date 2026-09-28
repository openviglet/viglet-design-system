# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS179** (deps: —) **the contrast gate never measures the accented label on the accent's own tints, which the icon picker draws** — A re-keyed accent that passes on the page can fail on its tints, as the default did at 4.11:1, and every gate stays green. → §VDS179

## Block F — What a consuming CMS needs from the package next

## Done when — VDS179

- **The accent label is measured on both accent tints, on both grounds**
  contrast.test.ts lists the two pairs among those it finds, and the re-key case fails a
  label too light for the tint.

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
