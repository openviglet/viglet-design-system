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

### §VDS219 exportToXlsx on its own entry point

VDS211 moved `xlsx` from `dependencies` to `peerDependencies` so each product can
install the fixed release from `cdn.sheetjs.com`. It had to be a required peer, not the
optional one that design asked for: the root entry re-exports `exportToXlsx`, and
`dist/index.es.js` imports `xlsx` at the top. A Vite 8 build fails with "Rolldown failed
to resolve import" when a dependency imports a package that is not installed, whether
the import is static or dynamic and whether anything calls it or not (checked against a
scratch package on this repository's Vite). So Shio, which never exports a sheet, now
has to declare `xlsx`. If it does not, pnpm's peer auto-install brings 0.18.5 back from
npm.

Expected: `exportToXlsx` gets its own entry point, `./xlsx`: an `exports` row in
`package.json`, a build input in `vite.config.ts` and a line in `check-exports`. It is
the only module there that imports `xlsx`. Once nothing reachable from the root imports
it, `peerDependenciesMeta` can mark `xlsx` optional, and `scripts/externals.test.ts`
flips its required-peer assertion.

The root re-export stays until Turing and Dumont import from `./xlsx`. The non-goal
forbids removing console-era exports before both consoles cut over. Until then, the root
keeps the static import and the peer stays required. So this lands in two commits: first
the subpath, then, after both shims (`src/lib/export-xlsx.ts` in each console) point at
it, the root export goes and the peer becomes optional.

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

### §VDS229 A bar for one button

Measured in Shio at 1920px on four lists built on `BentoDataTable` (post types, users,
activity, a folder listing): when the consumer passes no `toolbar`, the bar still
renders at `min-h-12` with a bottom border, holding one ghost button, Columns, at the
far right. That is 48px and a rule between the hero and the column headers, for a
control most readers never use, and it is the first thing the eye meets on every list.

The bar exists for good reasons (the selection count's live region, the selection
actions, a consumer's filter), and none of them is present in this state.

Direction: when there is no toolbar and nothing is selected, the bar collapses, its live
region stays (`sr-only`, as today when there is nothing at all), and Columns moves into
the header row as an icon button in the actions column, where the per-row menus already
sit. A table with a toolbar keeps today's bar. Selecting a row brings the bar back with
its actions. The parity and screenshot tests change for the no-toolbar case only;
consumers change nothing. Reported by Shio (SH1307 and the lists around it), and Turing
and Dumont draw the same bar.

### §VDS230 Initials in a colour that means nothing

Measured in Shio at 1920px on the site list (sixteen rows) and the post-type list
(twenty-eight): `BentoIdentityCell` derives a tone from the name, so each row gets a
saturated square in one of the bento tones with white initials. Down a list that is a
column of orange, blue, violet, pink and teal squares that carries no information (the
hue is a hash, so two similar records differ for no reason and four sites starting with
V wear four colours) and competes with every mark that does mean something, including
the product accent.

The square is useful as a shape: it anchors the row and gives the eye a column to scan.
The colour is what is loud.

Direction: the default becomes neutral, a muted square (`bg-muted`, foreground
initials), and a tone is drawn only when the consumer passes `tone`, which is how a list
that does carry a category (an agent versus a person, a system type) can still say so. A
record with an image (a site thumbnail, a user avatar) should be able to pass it and get
the picture instead of initials. The hash stays available for a consumer that wants it,
as an exported helper rather than the default.

### §VDS231 A ring on every row

Measured in Shio at 1920px: every row of a `BentoDataTable` with `rowActions` ends in
the `BentoActionsMenu` trigger drawn as a bordered circle. On a list of sixteen that is
a column of sixteen rings on the right edge, as heavy as the row content, and on the
activity log (a long list) it is the strongest vertical line on the page.

The menu has to stay focusable and announced; SH899 moved the actions off hover-only
buttons for exactly that reason, and that rule is right. What can change is the drawing.

Direction: the trigger in a table row is a borderless ghost icon button at muted
foreground, which gains its hover fill and full contrast when the row is hovered or
focused, and always shows its focus ring. It remains in the tab order through the row's
roving focus, so nothing a keyboard reader has today is lost. The standalone menu (a
card's corner, a hero) can keep its outline, so this is a variant the table passes, not
a change to every trigger.

### §VDS232 Rows with no air

Measured in Shio at 1920px: `BentoDataTable` defaults to `rowHeight = 44`, and the
package's own cells (`BentoIdentityCell`, `BentoChangeCell`) draw two lines of text
each. Two lines of 14px and 12px type in a 44px row leave about 4px above and below, so
the text touches the dividers, and a row with an identity cell on the left and a change
cell on the right is two lines tall at both ends. The curator who reported it called the
list suffocating; the measurement says the rows have no air.

Two directions, not exclusive. Give a two-line row its room: a default of 52 or 56 when
a column declares two lines, or a `density` prop (`comfortable`, `compact`) so a long
log can stay compact. And make the second line optional in practice: `BentoChangeCell`
can put the actor in the tooltip or after the time on one line ("há 8 min · admin") when
the row is single-line.

The virtual scroller computes everything from `rowHeight`, so a change of default is a
visual change for every consumer and belongs behind the screenshot tests with a release
note, not a silent patch.

### §VDS233 A title that looks like a form field

Measured in Shio at 1920px on a site page (`/bento/content/object/{site}`, built on
`BentoEntityShell`): the title "ShowCase" is drawn inside a visible rectangle that spans
the hero to the action buttons, with a second, shorter box around the text itself, at
rest, before any focus or hover. It reads as a form field someone left open, or as a
rendering fault, and it is the largest element on the page.

An inline edit should look like a title until the reader shows intent: no border at
rest, a subtle fill or underline on hover, the input frame on focus. The second inner
box suggests two elements are being outlined, the input and its measuring sizer, and
only one should ever be.

Reproduce on the entity-shell story and in Shio; fix the at-rest drawing; add a
screenshot test of the at-rest state, since the existing tests cover editing and not
looking.

### §VDS234 The theme toggle looks pressed

Measured in Shio at 1920px on every route: the shell header's theme toggle, at rest, is
drawn with an accent-coloured border, which is how the rest of the package draws focus
or a selected state. It sits beside the user avatar, a quiet neutral circle, and on a
light page it is one of the three accent marks above the fold, competing with the page's
primary action.

A theme toggle is a utility control; nothing about it is pending or selected. It should
be a ghost icon button in the header's neutral, like the avatar beside it, with the
accent only on its focus ring. If the border is there because the toggle reads as active
in one theme, the active state belongs to the menu it opens, not to the trigger.
Reported by Shio; the header is shared, so every product shows it.

### §VDS235 A work grammar beside bento

Bento was designed as a showcase look: frosted panels, generous tiles, a hero of
eyebrow, large title and subtitle on every page. Measured in Shio at 1920px, the hero
alone takes about 150px on every route, every list sits inside a frosted card, and pages
that are tools people work in for hours (a content browser, a post editor, an activity
log) are drawn with the same weight as a home dashboard. The curator who uses it daily
called it suffocating, and this is the third redesign of that console.

Bento suits a landing surface and a dashboard. A working surface needs density, flat
ground and a compact header, so that the content is the largest thing on the screen.

Direction: a second page grammar in the package, beside bento, for work surfaces. A
compact header (title and actions on one line, breadcrumb above in small type, no
subtitle by default), content on the page ground without a frosted card, lists flush
with the page and separated by hairlines, one toolbar per page. Same tokens, same
components inside; what changes is the frame. A product chooses per route, and the shell
stays the same, so a product can move one page at a time.

Reported by Shio with its own measurement of curator tasks (SH1315 in that repository)
as the judge.

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

### §VDS228 The site nav on a phone

SiteNav keeps every action on one row at every width. Below 1180px it hides the section
links, which is right, but the actions stay: a primary button, a ghost button and the
theme toggle, beside the brand and the family chip. Measured on Quickshell's site after
its move to ./site (QS370), at a 390px viewport the actions row ends at x=623 and the
document's scroll width is 688px, so the page scrolls sideways and the full-page capture
is 688px wide. The site carried the same overflow before the move (621px), so this is
the template's, inherited by every product site that passes two buttons and a toggle.

Done when:

- At 320px and 390px a SiteNav with a brand, a parent chip, two buttons and the toggle has
  a scroll width equal to the viewport.
- The primary action is still reachable at 320px.
