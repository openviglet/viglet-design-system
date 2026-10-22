# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

## Block E — The assistant every product shares

## Block C — One look across products

## Block H — Product sites on the package

- 📋 **VDS226** (deps: —) **The brand and hero marks are forced into a rounded square, which squashes a mark that is not a tile** — A product whose mark carries its own silhouette has to undo the size, the radius and the hero's box-shadow in its own stylesheet. → §VDS226
- 📋 **VDS227** (deps: —) **SiteHero has no slot between the actions and the meta line, so a site redraws the meta and pills itself** — FreeWilly's session sits under its call to action, so it copies the shared meta and pill markup back into the product to keep that order. → §VDS227

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

## Done when — VDS195

- **A story file whose browser drops fails, and npm test exits instead of hanging**
  Failing fast is what the gate lacked: every test passed, and the run still never
  ended.

## Done when — VDS219

- **A Vite consumer that imports only the root entry builds with no xlsx installed** A
  scratch Vite app importing the root of the built dist, with xlsx absent, completes
  vite build.

## Done when — VDS217

- **Every alegauss site is in consumers.json with its entries counted**
  viglet-ds-consumer-entries passes in each site, from its imports or its pinned links,
  and fails once the package is removed.

## Done when — VDS221

- **The hub renders navy from the package and is in consumers.json** Its tone.css is
  gone, and the tone contract and the entry census both pass with tone navy.

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
