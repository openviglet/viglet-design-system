# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS189** (deps: VDS180 ✅) **A census run left desktop-dark unmeasured on 14 of 34 routes and still offered its lower figure for --write** — An allowance lowered from a partial reading turns the next complete run into a false regression, so a view with gaps must not be compared or written. → §VDS189
- 📋 **VDS190** (deps: VDS180 ✅) **The census counts a hidden morph copy and a switch that is on as primaries, and a scrolled-under tile as covered** — A figure a correct page cannot lower stops being read, so only visible buttons count as primaries and only a fixed corner counts as covering. → §VDS190

## Block F — What a consuming CMS needs from the package next

## Block C — One look across products

- 📋 **VDS192** (deps: —) **A one-row BentoDataTable reserves about 450 px of empty panel, so a short list reads as a failed load** — A table as tall as its rows up to the space available, virtualising only past it, makes a short list look short. → §VDS192

## Block E — The assistant every product shares

- 📋 **VDS191** (deps: —) **The assistant has no place for its own settings, so Shio puts its preferences in the header as a second bell** — A settings slot on the assistant keeps the header to the contract's set and puts the choice beside the thing it configures. → §VDS191

## Done when — VDS182

- **The gradient chip renders only in entity heroes and hub tiles** Identity is the one
  place a picture names a thing.
- **Tones map to five states and render through BentoStatusMarker** Colour that means
  state is readable; colour per area is noise.
- **The reference artboards are redrawn from preset tokens first** The direction is
  reviewed as composition before a component changes.

## Done when — VDS185

- **The dock rests at the rail's foot and opens as an anchored popover** A reserved slot
  is the only place it cannot cover content.
- **The census reports zero dock overlaps with interactive elements** An overlap is
  invisible to every other check.

## Done when — VDS186

- **Turing, Dumont and roadkeep-gui each carry a measured reading** A figure the round
  lowers must be one every bento consumer reports, not only Shio.
- **No committed route names an id or an account** The allowance is committed, so a
  concrete segment would publish product data.

## Done when — VDS189

- **A figure is compared only over routes every view measured** Otherwise a view that
  lost routes reads as an improvement.
- **--write refuses a view with unmeasured routes, and names them** The allowance is
  trusted; a partial reading must not become it.

## Done when — VDS190

- **A button counts as a primary only when rendered visible** The morph's hidden copy is
  not a second primary.
- **A switch, checkbox or toggle is never counted as a primary** Its fill states a
  value, not a claim to be the page's action.
- **A control scrolled under a sticky header is not a corner overlap** That is an
  ordinary scrolling state, not a covered control.

## Done when — VDS191

- **The assistant renders a control for its own settings when given one** A product's
  dock preferences need a home that is not the header.

## Done when — VDS192

- **A table with fewer rows than the space holds is as tall as its rows** A short list
  must not read as a failed load.

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
