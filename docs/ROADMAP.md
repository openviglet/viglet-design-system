# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS186** (deps: VDS180 ✅) **Turing, Dumont and roadkeep-gui have no look reading, so their drift fails nothing** — A reading per consumer is what lets a look fix land in the package instead of in whichever product was measured first. → §VDS186

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS184** (deps: —) **A hero's way back names one parent, so a post five folders deep does not say where the reader is** — An optional ancestor trail where the back link sits gives a nested CMS a location without a second nav, and leaves flat products unchanged. → §VDS184

## Block C — One look across products

- 📋 **VDS181** (deps: —) **The rail names a section only in a tooltip, so a reader learns it by hovering, and no item can show a count** — A short label under each icon, and an optional count badge on the item that owns it, keep the rail's few choices while making them recognisable at a glance. → §VDS181
- 📋 **VDS182** (deps: VDS180 ✅) **Glass, gradient chips on every tile and hero, and one tone per area make colour everywhere and mean nothing** — Keeping the chip for identity and turning tones into state lets the accent mark the primary action and the current place, which is what a working screen needs. → §VDS182
- 📋 **VDS183** (deps: VDS180 ✅) **BentoListPage requires renderTile, so products render records nobody picks by picture as a tile mosaic** — A table by default, with tiles as the variant for visual or few entities, makes list.dc.html's discriminator the path of least resistance. → §VDS183

## Block E — The assistant every product shares

- 📋 **VDS185** (deps: VDS180 ✅) **The shell owns the dock's corner but reserves nothing there, so the orb covers row actions in the column** — Resting the dock at the rail's foot, a slot the shell already reserves, keeps one voice for notices and can never hide a control. → §VDS185

## Done when — VDS181

- **Every rail section with a labelKey shows its label under the icon** A tooltip is not
  a name a reader can scan.
- **BentoNavItem accepts a count and the rail draws it as a badge** The count sits on
  the destination that owns it, never in the header.
- **The rail stays one level, with no groups and no collapse state** The few-choices
  structure is what the rail exists to keep.

## Done when — VDS182

- **The gradient chip renders only in entity heroes and hub tiles** Identity is the one
  place a picture names a thing.
- **Tones map to five states and render through BentoStatusMarker** Colour that means
  state is readable; colour per area is noise.
- **The reference artboards are redrawn from preset tokens first** The direction is
  reviewed as composition before a component changes.

## Done when — VDS183

- **BentoListPage renders a table by default, tiles only when asked** The default is
  what products do, so it has to be the right answer.
- **BENTO-AUTHORING.md and list.dc.html state the same default** Two sources saying
  different things is how the drift started.

## Done when — VDS184

- **Heroes accept an ancestor list and render it as linked steps** A nested entity needs
  its location, not only its parent.
- **A route with one parent still renders the arrow back link** Flat products must see
  no change.

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
