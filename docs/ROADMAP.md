# Roadmap (active backlog)

## Block A — The gate the design system never had

- 📋 **VDS245** (deps: —) **The README counts sixteen consumers and four product sites while consumers.json has eighteen and six** — The consumer names are guarded but the counts beside them are read by nothing, so each new consumer leaves the number further behind. → §VDS245

## Block F — What a consuming CMS needs from the package next

## Block E — The assistant every product shares

## Block C — One look across products

- 📋 **VDS242** (deps: —) **A product claims its accent by retyping eight oklch values, and Shio's violet exists in the package only as a dot** — Three consumers already retype one amber, and a preset named by colour and selected by data-accent would let a product claim it as it claims a tone. → §VDS242
- 📋 **VDS244** (deps: —) **Console-era strings in both locales use Title Case, three-dot ellipses and Copied! where the brand guide says otherwise** — The guide makes the strings the bug, and a product reading the shared keys shows two voices on one screen until they are rewritten. → §VDS244
- 📋 **VDS247** (deps: —) **BENTO-AUTHORING's closing sentence prints [docs/reference/] with no link and splits in two** — The document ships and is served over MCP, so every reader and agent meets the broken pointer to the artboards. → §VDS247

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

## Done when — VDS239

- **A new canvas installs the system and mounts a Button by name** Checked once by hand
  on claude.ai after each publish, and the result recorded with the release.
- **The published folder is assembled from dist and docs/reference by a script** The
  script is the only writer, and nothing in the published copy is edited in the canvas.

## Done when — VDS242

- **Each product preset passes the contrast gate on both grounds** The package contrast
  gate measures every data-accent preset the way it measures the tones.
- **A preset works on a subtree as well as on the root** A parity story renders one
  preset inside a cool page and its chip, fill and button all follow it.

## Done when — VDS244

- **No locale string is a Title Case label or uses three dots** A test over both locales
  holds the guide's casing and ellipsis, so the strings cannot drift back.

## Done when — VDS245

- **A test fails when a README count disagrees with consumers.json** The counts are the
  prose nobody reads when adding a consumer, so only a check keeps them true.

## Done when — VDS247

- **The closing sentence links reference/README.md in one paragraph** A pointer that
  renders as a bare bracket sends no reader to the artboards.

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
