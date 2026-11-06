# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

## Block E — The assistant every product shares

## Block C — One look across products

- 📋 **VDS238** (deps: —) **The tokens exist only as CSS custom properties, so a native app or a design tool cannot read them** — React Native and a canvas colour picker read resolved values, not var() and oklch chains, and a JSON generated from preset.css keeps one source. → §VDS238
- 📋 **VDS239** (deps: VDS237 ✅, VDS238, VDS240) **The package is not a Design System on claude.ai, so a design canvas for a Viglet product starts on another system** — With a designer README, tokens.json, the global build and foundation cards, a canvas can install it and mount its components by name. → §VDS239
- 📋 **VDS240** (deps: —) **Nothing says how a Viglet product writes or what it shows, so each product and each agent invents its voice** — The docs are engineering contracts, and a short guide to voice, casing, numbers, colour, imagery, icons and motion is what a writer reads first. → §VDS240
- 📋 **VDS241** (deps: —) **No reference shows a phone-first app, so a mobile product draws its tab bar, primary action and sheets alone** — The reference canvases and BENTO-AUTHORING stop at a shrinking console, and the first mobile consumer is about to draw these from scratch. → §VDS241
- 📋 **VDS242** (deps: —) **A product claims its accent by retyping eight oklch values, and Shio's violet exists in the package only as a dot** — Three consumers already retype one amber, and a preset named by colour and selected by data-accent would let a product claim it as it claims a tone. → §VDS242

## Block H — Product sites on the package

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

## Done when — VDS217

- **Every alegauss site is in consumers.json with its entries counted**
  viglet-ds-consumer-entries passes in each site, from its imports or its pinned links,
  and fails once the package is removed.

## Done when — VDS221

- **The hub renders navy from the package and is in consumers.json** Its tone.css is
  gone, and the tone contract and the entry census both pass with tone navy.

## Done when — VDS238

- **tokens.json is generated from preset.css and never stale** A test regenerates it and
  fails when the built copy differs, the guard site.dc.html already has.
- **Every colour carries a hex a React Native StyleSheet accepts** A test walks
  tokens.json and fails on any colour value that is not a six- or eight-digit hex beside
  its oklch.

## Done when — VDS239

- **A new canvas installs the system and mounts a Button by name** Checked once by hand
  on claude.ai after each publish, and the result recorded with the release.
- **The published folder is assembled from dist and docs/reference by a script** The
  script is the only writer, and nothing in the published copy is edited in the canvas.

## Done when — VDS240

- **A consumer can read the guide from the installed package** The README links it from
  the front door and the npm tarball contains it.
- **The guide covers voice, casing, numbers, states, colour, imagery, icons, motion**
  Each section has one example to follow and one to avoid, and the owner has signed off
  the voice.

## Done when — VDS241

- **docs/reference holds phone artboards drawn from resolved tokens** The tab bar,
  bottom sheet, row list with state markers and a dark full-screen surface exist at 390
  by 844 with role labels only.
- **The phone rules are written beside the artboards** BENTO-AUTHORING or a sibling file
  states each rule an artboard draws, and the two agree.

## Done when — VDS242

- **Each product preset passes the contrast gate on both grounds** The package contrast
  gate measures every data-accent preset the way it measures the tones.
- **A preset works on a subtree as well as on the root** A parity story renders one
  preset inside a cool page and its chip, fill and button all follow it.

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
