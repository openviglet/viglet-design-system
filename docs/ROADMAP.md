# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

## Block E — The assistant every product shares

## Block C — One look across products

- 📋 **VDS205** (deps: —) **A list's controls sit in three places, and the table's toolbar is a band holding only Columns** — Filter, import and New live in the hero while Columns sits alone in a band inside the table, so the controls are apart from what they control. → §VDS205
- 📋 **VDS206** (deps: —) **BentoListPage renders tiles or a table and offers no way to switch between them** — The same records are better as pictures at twenty and as rows at four hundred, and a consumer can only choose one for every reader. → §VDS206
- 📋 **VDS207** (deps: —) **No shared cell for a record's identity, or for when and by whom it last changed** — Each product draws its own name cell and its own absolute date, so two products disagree on how a record is recognised and how recent it is. → §VDS207

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
