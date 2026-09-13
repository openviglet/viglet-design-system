# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS157** (deps: —) **a tooltip's provider-delay parity test fails only when the whole suite is loaded** — it passes alone and failed two of four full runs, so the suite's red is noise and a real regression in the delay would read as the same flake. → §VDS157
- 📋 **VDS158** (deps: —) **the README's component lists are typed by hand, and the App Components one omits seven exports** — AppSwitcher, ErrorBoundary and five more are shipped and unlisted, so the front door reads as the whole surface while being a subset. → §VDS158

## Block F — What a consuming CMS needs from the package next

## Block G — The package knows one chrome

- 📋 **VDS146** (deps: VDS145 ✅) **SectionChrome, its provider and hook, and AdaptiveSectionCard's console branch outlive the era they serve** — Once no consumer renders console chrome, every chrome branch is dead code a new component can still copy. → §VDS146

## Done when — VDS157

- **The delay assertion no longer rests on a fixed sleep** it measures the interval
  across the hover or drives it with a fake clock, so a loaded runner cannot move it.
- **The full suite runs green three times in a row** a flake is fixed only when the run
  that caught it stops catching it.

## Done when — VDS158

- **A gate reads the README's lists and the exported surface together** it fails on a
  name shipped and unlisted, and on one listed after it stopped being exported.

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
- **Do not make bento the only chrome this package knows** The chrome census still
  measures console-era chrome in two consumers, recorded as mixed in consumers.json, so
  a shared form must still be able to say which chrome it is in.
