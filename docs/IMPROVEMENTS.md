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

### §VDS237 A browser build with a global

The package ships ESM for a bundler, which is right for its consumers and closes it to
every surface that loads a script by URL: a design canvas, a static mockup, a page with
no build. A Shio Mobile artboard on the claude.ai design canvas could link `tokens.css`
and the styles and nothing else, so every Button, Tabs, Switch and status marker was
redrawn by hand. A redrawn component is the drift this package exists to prevent.

A second build output, `dist/viglet-ds.global.js`, bundles the parts a mockup draws
(Button, GradientButton, Badge, Card, Input, Textarea, Tabs, Switch, Checkbox, Progress,
Separator, Avatar, BentoStatusMarker) as an IIFE that takes React and ReactDOM from the
page's globals and assigns `window.VigletDS`. It needs no stylesheet of its own: the
`./styles` CSS already carries the compiled utilities and is linked by CDN today.

BentoStatusMarker reads `bento.state.*` with no default, so the bundle initialises the
package's own i18n resources once, from `<html lang>`. No router and no axios: a
component that needs one stays out of the subset.

React 18 is the floor; a test renders the subset against React 18 and 19. The output
gets a `size-budget.json` row, and `check-dist` holds it to no `import` or `require` at
all, which is what a bare specifier means in an IIFE.

Not a CDN product for applications: a consumer with a build keeps importing the ESM
entries.

### §VDS238 Tokens as JSON

Every token is a CSS custom property, and most colours are `oklch()` or a `color-mix()`
over another property. A browser resolves that; a React Native StyleSheet does not, and
neither does a design tool's colour picker or an agent reading the MCP `tokens`
resource, which serves raw `preset.css`. Shio Mobile is Expo, so its theme would
otherwise copy hex values out of a browser and never hear about the next change.

`scripts/build-tokens.mjs` also writes `dist/tokens.json` in the W3C design-tokens
format: colours, radii, control heights, font families and the mono step, the bento
state and status colours, each resolved for both grounds and every tone, with the
default accent's derived values computed. Each colour carries its oklch value and a hex
an RN StyleSheet accepts. The resolver is `scripts/lib/contrast.mjs` (`groundTokens`,
`parseColour`, `hex`), which the contrast gate and `site-reference.mjs` already use, so
no colour library joins and the JSON cannot disagree with the measured ratios.

The translucent tokens (accent surface, line, ring, shadow are mixes with transparent)
come out as 8-digit hex with alpha, and a test pins one. A `./tokens.json` export row
ships the file, and the MCP `tokens` resource serves it beside the preset.

The JSON is generated, never edited; a test regenerates it and fails when it is stale,
the guard `site.dc.html` already has.

### §VDS239 Publishing to the design canvas

A claude.ai design canvas offers the design systems published there as "Design System"
artifacts, installs the chosen one into the canvas and mounts its components by a global
name. This package is not one, so a canvas made for a Viglet product starts on the
organisation's default system, and the Shio Mobile artboard had to be re-skinned by hand
once the right system was named.

Publishing it needs four things: a README for someone designing rather than installing
(the surfaces, the accent re-key, the tones, the state colours, which component to reach
for), assembled from `docs/BRAND.md` and `catalogue.json` rather than written a second
time; the `tokens.json` the canvas's pickers and text styles read; the global build a
canvas mounts; and foundation cards. Colour on each ground already exists in
`grounds.dc.html` and the generated `site.dc.html`; the new cards are the type scale,
the radius scale and the control heights, generated from the preset the way
`site-reference.mjs` generates `site.dc.html`, with the same staleness check.

A script assembles that folder from `dist/` and `docs/reference`, the way
`publish-ds.cmd` assembles the npm package, and the publish itself is an operator step
on a claude.ai account. The published copy is regenerated, never edited there: an edit
made in the canvas is lost on the next publish.

### §VDS240 A brand and voice guide

The documentation is a set of engineering contracts: what a component accepts, which
token a product claims, what a gate measures. None of it says how a product on the
package writes or what it shows, so the copy in each console, product site and now a
mobile app is written from scratch by whoever is there, a person or an agent.

A short `docs/BRAND.md` closes that, in two parts. The first holds for every consumer,
because the package already decides it: casing for titles, labels and buttons, how
numbers, units and dates are written, the words for the states it colours (published,
draft, scheduled, changed, archived), where the gradient belongs and where a neutral
does, the icon set and its stroke, and motion with its reduced-motion floor. The second
is the Viglet family's own: voice and person in Portuguese and English, and imagery
(product marks, the mascot, the formula background). Half of `consumers.json` is not a
Viglet product, so the split says which half binds a Roadkeep or Winwright site. Each
rule carries one example to follow and one to avoid.

This task writes down what the products already do, read from the package's own i18n
strings, and asks the owner where they disagree; it does not invent a voice. The README
links it from its front door, `package.json` `files` ships it, and the MCP server serves
it as `viglet-ds://brand` beside `authoring` and `boundary`, which is how a consumer's
agent already reads the package.

### §VDS241 Phone-first patterns

The reference canvases draw the shell, the list, the detail, the form, the split and the
product site, all from a desktop width down. BENTO-AUTHORING mentions a phone only to
say that a page must not add a second always-visible navigation. That rule is right for
a console that shrinks; it says nothing to an app that is phone-first, where a bottom
tab bar is the navigation and the primary action is a thumb's reach away.

Shio Mobile is the first such consumer: a tab bar, bottom sheets for confirmations, a
full-screen camera, list rows that carry a state marker, all at the touch height. Drawn
without a reference, they will be drawn differently by the next mobile product.

Reference artboards at 390 by 844, with role labels only (no product data, per the
non-goals): a tab bar of N destinations with one primary action, the bottom sheet with
its confirm, a row list with state markers, a full-screen surface on the dark ground,
and the touch-height control scale. They are generated from the preset through
`scripts/lib/contrast.mjs`, the way `site.dc.html` is, with its staleness check, so they
need no `tokens.json`.

The rules go in a phone section of BENTO-AUTHORING rather than a sibling file, because
that document already ships in the package and is served as the MCP `authoring`
resource. Whether web components follow is a later line: the first mobile consumer is
React Native and reads `tokens.json`, not the React primitives.

### §VDS242 Product accent presets

A product claims its colour by writing four accent stops and four primary inputs on
`:root`, values it works out and retypes. Three consumers have done it, all with the
same amber (the Roadkeep GUI, the Roadkeep Site and the Roadkeep GUI Site in
`consumers.json`), and `site-reference.mjs` types that amber and a green by hand for its
artboard. The package names a colour per product in `--vg-product-turing`,
`--vg-product-shio` and `--vg-product-dumont` and uses it only for a dot, and the Shio
Mobile artboard re-keyed to Shio's violet by hand.

An accent preset selected by `data-accent`, the way a tone is selected by `data-tone`,
would set the accent stops, the readable foreground on both grounds and the primary
inputs, restating the derived tokens inside the block so it also works on a subtree.
Presets are named by colour (`amber`, `violet`, `teal`, `blue`), never by product, the
rule the tones already follow; `--vg-product-*` stays the dot. The contrast gate
measures each preset on both grounds, as it measures the tones, and `site-reference.mjs`
reads the presets instead of its typed values.

Which preset a product uses stays the product's decision, recorded in the `accent` field
its `consumers.json` entry already carries; the three amber consumers move to the preset
when they next upgrade.

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
