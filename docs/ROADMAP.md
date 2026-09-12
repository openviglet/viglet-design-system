# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS149** (deps: VDS131 ✅) **each product hand-rolls the palette trigger and its keyboard shortcuts, and the two bindings already differ** — The shortcuts dialog lists the question mark as global, so a product binding the slash instead shows a guide to a dead key and leaves its real shortcut unlisted. → §VDS149
- 📋 **VDS150** (deps: VDS136 ✅) **192 of 237 exported components carry no doc comment, so find_component can match them only by name and props** — The catalogue takes a purpose from the declaration and invents none, so an agent asking for a job misses every component whose comment was never written. → §VDS150
- 📋 **VDS153** (deps: VDS143 ✅) **the list page's layout editor disables its buttons while it saves, so the pressed button drops focus** — Save layout, cancel, reset and set-as-default each take disabled={busy}, the pattern VDS143 replaced in the form hero, save bar and entity shell. → §VDS153

## Block G — The package knows one chrome

- 📋 **VDS146** (deps: VDS145 ✅) **SectionChrome, its provider and hook, and AdaptiveSectionCard's console branch outlive the era they serve** — Once no declared consumer renders console chrome, every chrome branch is dead code a new component can still copy, guarded by a non-goal whose reason is spent. → §VDS146
- 📋 **VDS147** (deps: VDS146) **the console-era router components are still exported after being deprecated** — PageHeader, SubPage, GridList, InternalSidebar and their siblings still ship, so a new screen can still be built on the chrome every consumer is leaving. → §VDS147

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
