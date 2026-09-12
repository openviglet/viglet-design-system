# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS137** (deps: —) **no gate measures a consumer's own accent or primary override, only the preset's values** — The contrast test reads the preset and pairs by a naming rule the accent family does not follow, so a product's re-keyed orange can ship below AA with every gate green. → §VDS137
- 📋 **VDS138** (deps: —) **the layer offers no virtualized, keyboard-operable data table, so consoles hand-roll each list** — BentoListPage renders tiles, so a list a curator sorts, range-selects and acts on at scale is rebuilt per product without the contract's keyboard rules. → §VDS138
- 📋 **VDS139** (deps: VDS138) **the layer has no filter bar or filter chips, so each product composes its own query row** — Filtering by type, state, locale, author and date needs one shape a reader learns once, and a filter row drawn per product is the drift this package exists to stop. → §VDS139
- 📋 **VDS140** (deps: —) **three planned console surfaces need the same diff and version rail, and the layer offers neither** — Revision history, review and translation each compare two values, so a diff drawn per surface would disagree about what changed and how it reads. → §VDS140
- 📋 **VDS141** (deps: VDS131 ✅) **no component in the layer owns a main landmark or a skip link** — The contract gives the reading column to the shell, yet a consumer composing its own main decides landmarks page by page, and none offers a skip link. → §VDS141
- 📋 **VDS142** (deps: —) **an actions-menu item takes no id, so no lint can match a console verb to an agent verb** — Every console action is an anonymous onSelect while the agent's verbs are named strings, so a new console action with no agent equivalent is invisible to any census. → §VDS142
- 📋 **VDS143** (deps: —) **a button that is loading sets disabled and drops the focus of the control just pressed** — Keyboard and screen-reader users lose their place on every save, because a disabled button leaves the tab order at the moment the result is announced. → §VDS143
- 📋 **VDS149** (deps: VDS131 ✅) **each product hand-rolls the palette trigger and its keyboard shortcuts, and the two bindings already differ** — The shortcuts dialog lists the question mark as global, so a product binding the slash instead shows a guide to a dead key and leaves its real shortcut unlisted. → §VDS149
- 📋 **VDS150** (deps: VDS136 ✅) **192 of 237 exported components carry no doc comment, so find_component can match them only by name and props** — The catalogue takes a purpose from the declaration and invents none, so an agent asking for a job misses every component whose comment was never written. → §VDS150

## Block G — The package knows one chrome

- 📋 **VDS144** (deps: VDS129 ✅, VDS130 ✅) **nothing measures which consumers still render console chrome, so the cutover a non-goal waits on is unobservable** — The register marks three consumers console while Shio renders none of it and Dumont still imports console-era components over two hundred times. → §VDS144
- 📋 **VDS145** (deps: VDS144) **the section-chrome context defaults to console, so a bento consumer wraps every route in a provider to escape it** — Shio wraps about twenty-five routes in a bento provider, and any component rendered outside those wrappers silently takes the console look. → §VDS145
- 📋 **VDS146** (deps: VDS145) **SectionChrome, its provider and hook, and AdaptiveSectionCard's console branch outlive the era they serve** — Once no declared consumer renders console chrome, every chrome branch is dead code a new component can still copy, guarded by a non-goal whose reason is spent. → §VDS146
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
- **Do not make bento the only chrome this package knows** Shio migrates behind a
  parallel route and will render both chromes for the length of that migration, so a
  shared form must be able to say which one it is in.
- **Do not remove the console-era exports before every console cuts over** PageHeader,
  SubPage, GridList and InternalSidebar still render live screens in all three; VDS24
  deprecates them, and removal is a separate decision with its own line.
