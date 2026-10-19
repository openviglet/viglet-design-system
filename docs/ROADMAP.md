# Roadmap (active backlog)

## Block A — The gate the design system never had

## Block F — What a consuming CMS needs from the package next

- 📋 **VDS219** (deps: VDS211 ✅) **A product that never exports a sheet must still install xlsx, because the root entry imports it** — Vite fails on an unresolved import even when nothing calls it, so the peer VDS211 made cannot be optional while the root carries exportToXlsx. → §VDS219

## Block E — The assistant every product shares

## Block C — One look across products

## Block H — Product sites on the package

- 📋 **VDS213** (deps: —) **Brand, footer, display face and neutrals are fixed to Viglet, so the accent re-keys only the highlight** — A product family with a warm ground cannot take the package without overriding the preset, which is the fork VDS23 set out to remove. → §VDS213
- 📋 **VDS214** (deps: VDS213) **No product-site layer, so eight alegauss sites each keep their own copy of one template** — Nav, Hero, Footer, Feature, CopyButton, ThemeToggle and the sponsor slot are copied per site and drift apart. → §VDS214
- 📋 **VDS215** (deps: VDS214) **Each product site keeps its own prerender.mjs and og-image.mjs, so a build fix lands eight times** — The prerender and OG steps are copied with the template, and ./vite already exists as the place for build-time helpers. → §VDS215
- 📋 **VDS216** (deps: VDS214) **A page with no build cannot take the tokens or the site layer, since both need Tailwind or React** — Three alegauss pages are plain HTML (commitclerk, the usage simulator and the time study), and they belong to the same family. → §VDS216
- 📋 **VDS217** (deps: VDS214, VDS216) **consumers.json has no chrome for a product site and no way to count a page that links the package** — The census reads imports only, so the plain pages would join as offMachine claims, the drift VDS129 made a failure. → §VDS217
- 📋 **VDS218** (deps: VDS213, VDS214) **No reference page shows a product site on both tones and both grounds with its contrast ratios** — A tone would be accepted by eye, and warm on light is the pairing most likely to fail AA on muted text. → §VDS218

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
