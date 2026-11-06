# Improvements

## Block A — The gate the design system never had

### §VDS121 The consumer whose declaration has to wait for its bump

VDS77 made `react-hook-form` a required peer, and six of the seven consumers declare it:
shio `^7.87.0`, turing `^7.82.0`, dumont `^7.86.0`, and cloud-frontend, cloud-console
and `@rk/ui` declared during that work. Schools is the one left.

Nothing is broken today, because schools pins `@viglet/viglet-design-system` to an exact
`2026.3.9` rather than a range, the newest release published. It never sees the peer
until somebody bumps it, and pnpm would then auto-install the missing peer rather than
fail — which is the same arrangement working by coincidence that VDS77 existed to
remove.

It was deliberately not declared during VDS77, and the reason is worth carrying. Schools
is adopting a check of its own — `src/dependencies.test.ts` — that fails any dependency
no file imports and that carries no documented reason, and it cross-checks each
documented peer against the *installed* manifest. Schools imports no form, so declaring
`react-hook-form` against the 2026.3.3 it installs would be a dependency nothing imports
and whose stated reason the check could not confirm, because that release still calls it
a dependency.

**So the declaration belongs in the same change as the version bump**, not before it.
Bump schools to the release carrying the peer, add `react-hook-form`, and add its entry
to that test's allowlist naming this package as the peer it is provided for — all three
together, so each one is true when it lands.

Until then schools is the consumer that does not declare it, and this line is what says
so rather than leaving it to be rediscovered.

### §VDS163 The tooltip red, and what a recurrence has to say

One full run turned `tooltip.parity.test.tsx` red on "waits for the delay a provider
above it sets", in the same run that reddened the inline-edit focus test. It has passed
in every full run since — eight of nine — and passes alone every time.

VDS162 explained the inline-edit half: a focus assertion with no wait. This half has no
such explanation. Its assertion is a lower bound on elapsed time measured from before
the pointer moves, and load can only make that number larger, so the red was not the
delay being wrong. What is left is the wait around it — `expect.poll` for the bubble, on
a four-second deadline. For that to expire, the tooltip never opened at all, which means
the hover never reached Radix.

A headless page losing focus would explain both files at once: `activeElement` falls
back to the body, and a pointer no longer over the trigger sends no enter. That is a
candidate, not a finding. Nothing measured it.

So this waits for a recurrence with its output kept. What the next one has to say is
which of the two expired — the poll, or the hover before it — and whether the page still
had focus. Raising the deadline before that is guessing at which number was wrong, and
would only make a stalled run take longer to say the same nothing.

### §VDS186 Reading the other bento consumers

The first `pnpm look:census --write` read Shio only: its dev server was the one running
on this machine, on port 5173 against a local backend. Turing, Dumont and roadkeep-gui
sit in `look-allowance.json` as `measured: null` with that reason, so nothing fails when
their look drifts, and every figure in the round is so far a Shio figure.

The work is operational, not new code. Start each consumer's dev server with its
backend, then run `pnpm look:census --url <id>=<start url> --auth <id>=<user:pass>
--write` with that consumer's bento entry as the start. The walk crawls from there and
reads the router, so nothing about the product needs to be declared first. Commit the
allowance it writes. A consumer that renders `<Routes>` below a splat route only shows
its nested patterns once the walk has reached a page under it. If a reading names a
route by a concrete segment rather than `:param`, the probe's route-table walk in
`scripts/look-census.mjs` missed that router. Fix it there before recording, because an
account name in a route would end up in a committed file.

### §VDS195 The story run stalls

On 2026-09-28 `npm test` ran for 35 minutes with no output and was stopped. Two later
runs of the stories project alone each used their whole 1500 s timeout while vitest
measured 34 to 64 s of tests. In each, one file lost its browser (`Browser connection
was closed while running tests`), a different file each time: `login.stories.tsx`, then
`bento-shell.stories.tsx`. The first also had four files that never connected (`Cannot
connect to the server in 60 seconds`). Both files pass alone in under four seconds.

The same evening it did not come back. The stories project passed alone in 40 s, and
again in 22 s with `npm run build` running beside it. The whole of `npm test` passed in
62 s. Both stalled runs had a build or a Storybook build beside them, and another
session was driving Chromium against a Shio dev server at the time, so load is the
suspect, but a build alone did not reproduce it.

So the defect worth fixing is narrower than a slow gate: once a page drops, the run
waits out whatever timeout wraps it instead of failing that file. Pick this up with a
reproduction in hand. Then read where the wall clock goes (`--reporter=verbose`,
timestamped), and check whether `browser.connectTimeout`, a bound on the stories
project's workers, or `teardownTimeout` turns the hang into a failure. The setting
belongs in `vitest.config.ts` beside that project, with the measurement in its comment.

### §VDS245 The README's consumer counts, checked

The README's opening says "the sixteen applications that install it" twice and "four are
Vite product sites", while `consumers.json` declares eighteen consumers and the list
right after "four" names six. The names are guarded: the consumers test refuses prose
that names a subset as though it were the whole set. The count words around them are not
read by anything, so each new consumer leaves the number one further behind.

Derive the check rather than the prose: a test reads the README's spelled-out counts
next to the roster ("the <n> applications", "<n> are Vite product sites", and the other
per-framework counts in that paragraph) and compares each with `consumers.json`, grouped
the way the paragraph groups them (framework and chrome). Then correct the README to
eighteen and six in the same commit, so the test lands green.

Writing the numbers as digits does not avoid this; the check has to compare them either
way.

## Block F — What a consuming CMS needs from the package next

### §VDS152 The deprecation ends

BentoActionsMenuItem.id shipped optional, with a warning outside production for an item
that has none, so a product that upgrades is told before it breaks. The deprecation only
means something if it ends: until the field is required, a new action without a name
type-checks, renders and escapes every census that reads data-action-id.

Once one release has carried the warning, make id required on BentoActionsMenuItem,
which BentoEntityShell's extraActions and the data table's row actions already pass
through, and delete warnWithoutId and its test. The change note in the ledger names the
release that warned. Before shipping, run viglet-ds-check-duplicates and a type-check in
each declared consumer's checkout, or read their source, and list any menu still built
without ids, so the breaking release is not the first they hear of it.

## Block E — The assistant every product shares

### §VDS185 The dock rests at the foot of the rail

The authoring contract gives the corner to the shell: the assistant dock is passed as
`dock`, and `BentoBackToTop` stacks above it, so no component pins itself to the
viewport. The ownership is right, but the result is wrong in the one consumer that was
measured. Shio passes its dock through `BentoShell` as the contract asks, and in every
1440 x 900 capture of 2026-09-28 the orb still sits over page content. It covers the
last row action in the trash, a delete button in the post-type table, a revert button in
the review queue, a tile's corner and the editor's preview. The shell owns the corner
but reserves nothing in it, so the column runs underneath. There are two ways out. One
reserves a gutter the height of the dock at the foot of the column on every page, which
costs space on every screen to protect one element. The other moves the dock's resting
place to a slot the shell already reserves, the foot of the rail, where the orb and its
count sit above the user menu. It opens as a popover anchored to the rail, and on a
phone, where there is no rail, it moves to the header's trailing edge. The second is the
proposal, because the rail foot is empty today and costs nothing. The census's overlap
measure is what shows it done in every consumer that mounts a dock.

## Block C — One look across products

### §VDS201 Package buttons off the control scale

The package half landed: BentoCalendar's previous, next, Today and view buttons and the
entity shell's status pill sit on --vg-control-dense, and the buttons that are text a
reader clicks (BentoInlineEdit's value, BentoDataTable's sort header, BentoDiff's folds,
a calendar entry) carry data-look="text", which look-census-probe.mjs leaves out of the
button-height figure. Measured in Chromium, those explain the 24 px (sort header) and
the 21, 33 and 37 px (the entity hero's inline-edit description and title) readings. The
16, 18 and 29 px readings are still unnamed: the status pill measured 25 px, not 18, and
the calendar header measured 24 to 30 px. What is left needs Shio's dev server and an
account: run look:census --json against it, name the component behind each of those
three values, put it on a control token or mark it as text, add it to
control-height.parity.test.tsx, and lower Shio's button-height allowance with --write,
which also drops the cards VDS202 now skips and the second mono VDS203 now reads as one
face.

### §VDS208 Remove the headerAction alias

VDS205 gave BentoListPage a toolbar prop that a table draws in its own bar, beside
Columns, and kept headerAction as a deprecated alias drawn in the same place so
consumers could move without a flag day. The alias was promised for one release. Once
Turing, Shio and Dumont pass toolbar instead (grep each for headerAction on its bento
list pages), delete headerAction from BentoListPageProps and the `ownToolbar ??
headerAction` fallback in bento-list-page.tsx, drop the test that draws it, and say in
the README's BentoListPage paragraph that it is gone. Do not remove it while any
consumer still passes it: its content would silently stop rendering, since an unknown
prop does not fail a build that spreads props.

### §VDS239 Publishing to the design canvas

A claude.ai design canvas offers the design systems published there as "Design System"
artifacts, installs the chosen one into the canvas and mounts its components by a global
name. This package is not one yet, so a canvas made for a Viglet product starts on the
organisation's default system, and the Shio Mobile artboard had to be re-skinned by
hand.

Everything but the publish exists. `npm run build && npm run design-system` writes
`design-system/project/` (git-ignored) in the layout the Design System type keeps: the
index, `tokens.json` in the type's list grammar (it cannot read the DTCG map
`dist/tokens.json` ships), a README assembled from `docs/BRAND.md` and the catalogue,
`components/bundle.js` (the browser build under its `@ds-bundle` header), `bundle.css`,
a guideline and a live preview per component, and the Latin faces.
`scripts/design-system.test.ts` holds it to the type's grammar. The foundation cards are
`docs/reference/foundations.dc.html`, beside `grounds.dc.html` and `site.dc.html`.

What is left is an operator step on a claude.ai account: create the system from the
Design System type, add a cover (`components/Cover/preview.html`, which the type writes
last), publish the folder's files with the index in the last call, and open a new canvas
to check that it mounts `VigletDS.Button`. A revision reads the published index first
and keeps its marker; the published copy is regenerated from here, never edited there.

The previews follow the light and dark themes only; warm and navy list their values for
the pickers, because the bundle's stylesheet keys tones on `data-tone`, not on a theme
id.

### §VDS244 Console-era strings brought to the brand guide

`docs/BRAND.md` (VDS240) writes down what the bento and site layers already do: sentence
case, the single-character ellipsis, no exclamation marks, and errors that say what
happened and what to do without "please". Its last section names the console-era strings
that still disagree, in both locales:

- Title Case: `forms.common.saveChanges`, `forms.formActions.saveChanges` (`Save Changes`),
  `forms.common.generalInfo`, `forms.common.advancedOptions`, `sidebar.toggle`, and the
  Portuguese `Salvar Alterações`, `Informações Gerais`, `Opções Avançadas`.
- Three dots: `common.loading`, `backendStatus.offline`, `backendStatus.checking`,
  `forms.common.search`, `forms.common.selectVendor`, `forms.common.filterFields`,
  `forms.iconPicker.searching`, `forms.iconPicker.orClickAi`.
- `forms.common.copied` (`Copied!`) and `forms.common.formSubmitFailed` (`Failed to submit
  the form. Please try again.`).

Rewrite those values in `src/i18n/locales/{en,pt}` to the guide, keeping every key so no
consumer's call breaks. A product that overrides one of these keys keeps its own value,
because `initVigI18n` lets the product's leaf win. Then add a test over both locales
that fails on a Title Case label or on `...`, so the strings cannot drift back, and
delete the guide's "Where the package still disagrees with itself" section.

Not a redesign of any component: only string values change.

### §VDS247 The reference link in BENTO-AUTHORING

The last paragraph of `docs/BENTO-AUTHORING.md`, under "What this does not cover", reads
"Every rule above, drawn rather than stated, is [docs/reference/]" followed by a blank
line and "artboards, one per decision". The link target and the count were lost, so the
sentence renders as a bracketed path with no link and breaks into two paragraphs.

The document ships in the package and is served as the MCP `authoring` resource, so an
agent reads the broken sentence too. Restore it as one paragraph linking
`reference/README.md`, without a count (the reference README states the count, and a
second copy here would drift the way the README's consumer counts did, VDS245).

### §VDS248 Accent presets in tokens.json

`dist/tokens.json` (VDS238) resolves every colour per tone and ground, and VDS242 added
the accent presets (`data-accent="blue|violet|teal|amber"`) after it, so the JSON
carries the package's default accent only. A React Native app such as Shio Mobile reads
`tokens.json`, not the CSS, and so still cannot take the violet preset it would claim on
the web.

`tokensJson` should add an `accent` group: per preset (from `accentsOf`), per ground,
the tokens the preset moves (`accent-from`, `-to`, `-fg`, the surfaces, the fills,
`primary`, `primary-foreground`), resolved with `groundTokens(…, tone, accent)` exactly
as the colours are. Under the cool tone is enough for a first cut; a preset's values do
not change with the tone except where the tone restates the primary inputs. Extend the
canvas tokens in `scripts/design-system.mjs` only if the Design System type can show
them, which it cannot as themes today (eight at most, and six are taken).

## Block H — Product sites on the package

### §VDS217 Counting product sites

Three steps have landed. `chrome` has `product-site`, and the census reads pinned
`<link>` and `@import` URLs in `.html` and `.astro` files. VDS222 added the three sites
already on the package: the Claude Tray Site and the Winwright Site on `./site`, and
Winwright Docs (Astro) on `./tokens.css` alone. VDS221 added the Alegauss Hub as
`marketing-site` with the new `navy` tone.

What is left: each other product site joins in the commit where it moves onto `./site`
(as claude-tray did in 01d6b8f). Measure its entries with `node
scripts/consumer-entries.mjs --consumer <id> --root <checkout>`, and widen the README
and code paragraphs that name every consumer, since `consumers.test.ts` refuses a
paragraph naming a subset.

Done when every alegauss site appears with its entries counted from source or HTML, and
removing the package from any one of them fails the census.

### §VDS221 A navy ground tone

The package half has landed: `navy` is a third tone in the preset, carried by
`tokens.css` and `site.css`, drawn in `OG_CARD_TONES` and on the site reference, held to
the contrast pairs and rendered by the parity digest. The Alegauss Hub is in
`consumers.json` with `tone: "navy"`.

What is left is in the hub, and it needs a release that carries navy, since the hub pins
2026.3.21:

- Bump the pin and delete `src/tone.css`. The hub's own lint lets that file
  declare colours by name, so the exemption goes with it.
- Drop the `NAVY` colour map in `scripts/prerender.mjs` and pass `tone: "navy"`
  to `ogCardSvg` instead.
- Compare the built pages before and after: the tokens are the same values, so
  nothing should move.
