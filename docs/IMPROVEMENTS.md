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

VDS197 and VDS200 put every control in control-height.parity.test.tsx on the dense, form
or touch height, yet the look census run against Shio on 2026.3.17 (SH1199, 2026-10-05)
still attributes seven button heights to this package: 16 px on the content object page,
18 px on the admin entity editors (auth and exchange providers, tokens, webhooks, email
settings), 21, 33 and 37 px on the group and role pages, 24 px on the admin lists, and
29 px on the scheduled page. Those are buttons the parity test does not list, most
likely the entity shell's hero actions, the list page's sort headers, BentoInlineEdit,
BentoTrail, a calendar cell or a tab trigger, rendered as a native button with its own
padding instead of a control size. Start from the census JSON (look:census --json on
Shio's dev server) to name the component behind each value, then either put it on a
control token or, where the element is not a control (a sortable header, a link styled
as text), say so in the census's own rule so it is not counted as one. Add each
component to the parity test with the height it resolves to, and lower Shio's
button-height allowance with --write when the reading drops.

### §VDS202 Cards are not control heights

look-census-probe.mjs samples the height of every visible button and [role=button], so a
card that happens to be a button counts as a control height. In Shio (SH1210,
2026-10-05) that is most of what remains of the product's button-height figure: the
files grid's tiles at 343 px, the marketplace entries at 182 px, and the Universal
Editor's site rows at 49, 68 and 69 px, whose height follows their description. Those
are not controls drawn off the scale; their content decides their height, and a consumer
cannot put them on a 32 or 36 px token without turning them into something else. The
figure exists to find controls drawn off the scale, and every card inflates it with a
value nobody can lower. Decide which elements the figure measures. One rule is to skip a
button taller than the touch step (44 px) and report it separately as a card count.
Another is to skip a button whose content is block layout (a flex column, a heading, an
image). Either way, a button 45 px or taller should stop reading as a control, while a
short pill or a link-styled button keeps counting, since those are the hand-drawn
controls the figure was built to catch. Apply it in look-census-probe.mjs, cover it in
look-census.parity.test.ts with a card and a pill, and rewrite Shio's allowance from a
fresh reading.

### §VDS203 One face, one mono

look-census-probe.mjs records the mono figure as the element's whole font stack, so two
elements drawing the same face count as two monos when one stack carries extra
fallbacks. Shio hit it on 2026-10-05 (SH1212): its GraphQL explorer's Monaco editors
take --vg-font-mono through the font option (SH1199), and Monaco appends its own
platform fallbacks, so the stack reads JetBrains Mono, ui-monospace, ... monospace,
Consolas, Courier New, monospace. Home's compact BentoChangeMark draws font-mono from
the package and reads the token's stack as written. Both render JetBrains Mono where it
is loaded and the platform's ui-monospace where it is not, yet the figure went from one
to two and failed the run. No consumer can lower it, because Monaco adds the fallbacks
after it has read the option. The font figure already compares the first family, which
is why it did not move. Make the mono figure do the same, or compare the stack only up
to its first generic family (monospace or ui-monospace), so that trailing fallbacks a
library appends are not a second face. Cover it in look-census.parity.test.ts with the
token stack and the same stack with Monaco's tail, which must count as one. Then rewrite
Shio's allowance, whose mono figure is recorded at two only because of this.

### §VDS204 A table that scrolls with its page

BentoDataTable mounts only the visible rows, and it finds that window inside a body
capped by the height prop. That cap is what puts a second scrollbar inside a page that
already scrolls: Shio's sites list shows eleven rows and a wide empty margin on a 1734
px screen, and its content browser passes height 560 on every viewport. The reader
cannot tell which scrollbar moves what, the wheel stops at the table's edge, and Print
or Find shows only the mounted window. The fix keeps virtualization but measures the
window against the document scroll instead of an inner box, with the header row sticky
under the shell's header, so a short list is as tall as its rows and a long one scrolls
the page. height stays as an opt-in for a table embedded in a panel or a dialog, where
an inner scroll is right. Done when a page passing no height scrolls once, the header
stays visible while it does, and the virtualization test still mounts only the visible
window. Drawn in Shio's docs/design/shio-site-list.dc.html, pin 7.

### §VDS205 One toolbar on a list

BentoListPage puts headerAction and the New button in the hero, and BentoDataTable draws
its own toolbar row above the header for the column menu and the selection bar. On a
list with no selection that row holds one button and about fifty pixels of nothing, and
the filter that narrows the rows sits a hero away from them. A list should have one bar,
glued to the table: the product's filter and secondary actions on the left, then sort,
the view switch where there is one, and Columns on the right. While rows are selected,
the same bar becomes the selection bar instead of a second band. New stays the hero's
one filled primary. The shape needs a toolbar slot on BentoListPage that the table
renders into its own bar, rather than a separate headerAction, and headerAction keeps
working for one release so consumers move without a flag day. Done when a list with no
selection renders exactly one bar between the hero and the header row. Drawn in Shio's
docs/design/shio-site-list.dc.html, pin 1.

### §VDS206 Tiles or rows, chosen by the reader

BentoListPage already takes both renderTile and columns, and picks the table whenever
columns is given. A product therefore decides once, for everyone, whether a list is
tiles or rows: Shio moved its sites to rows (VDS183), which is right at four hundred
sites and loses the one thing tiles were good at, recognising a site by how it looks.
Given both, the page should render a Grid and List switch in the list's toolbar, start
from a default the product passes (defaultView), and remember the reader's choice per
listId the way a column layout is remembered, through a callback the product stores, so
it is a per-viewer preference and never shared state. Keyboard and screen reader
behaviour stay each view's own: the table keeps its row model and the mosaic its tile
model. Done when a page passing both renderTile and columns shows the switch, honours
defaultView on first visit, and restores the reader's last choice. Drawn in Shio's
docs/design/shio-site-grid.dc.html, pin 1.

### §VDS207 The identity cell and the change cell

Every console list has a first column naming the record and a column saying when it
changed. Both are hand-drawn per screen today: a bold name and nothing under it, and a
toLocaleDateString that repeats one date six times and never says who. The redraw in
Shio's docs/design/shio-site-list.dc.html wants two cells the package should own so
Turing gets them too. BentoIdentityCell: a square of initials in a hue derived from the
name, the name, and a muted second line that carries a description or an address,
truncating rather than wrapping. BentoChangeCell: a relative time (2 days ago, then a
short date past a month) in the reader's locale with the absolute instant as its tooltip
and accessible name, and an optional actor line with an agent marker when the change
came from an agent. Neither fetches anything; both take values. Done when both are
exported from the bento entry, documented in the catalogue with their props, and render
the same in both grounds. Drawn in Shio's docs/design/shio-site-list.dc.html, pins 2, 3
and 5.
