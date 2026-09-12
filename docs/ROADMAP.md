# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS153** (deps: VDS143 ✅) **the list page's layout editor disables its buttons while it saves, so the pressed button drops focus** — Save layout, cancel, reset and set-as-default each take disabled={busy}, the pattern VDS143 replaced in the form hero, save bar and entity shell. → §VDS153
- 📋 **VDS154** (deps: —) **a TooltipProvider delay never reaches a Tooltip, because each Tooltip mounts its own provider with no delay** — The nav rail asks for a 200ms delay so a pointer crossing it does not flash every label, and gets none. → §VDS154
- 📋 **VDS155** (deps: —) **five doc comments open with a fix note or a caveat, which the catalogue then serves as the component's purpose** — find_component shows BadgeColorful as a sentence about markup safety and NavigationMenu as one about its landmark, so neither says what it is for. → §VDS155

## Block G — The package knows one chrome

- 📋 **VDS147** (deps: VDS146 ⏸) **the console-era router components are still exported after being deprecated** — PageHeader, SubPage, GridList, InternalSidebar and their siblings still ship, so a new screen can still be built on the chrome every consumer is leaving. → §VDS147

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
- **Do not remove the console-era exports before every console cuts over** Cutover is a
  reading, not a promise: pnpm chrome:census holds each consumer's chrome to its source,
  and a removal waits until no entry in consumers.json says console or mixed.
