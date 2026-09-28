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

### §VDS193 Name the crawl once it ends

The look census reads desktop-dark while it crawls and the other two views afterwards. A
reading is named by the router match the probe found, and when there is none (a splat
route, or a match the probe could not reach) by `routeOf` against the patterns known so
far. During the crawl that set is still growing, so a page the dark view read early can
be named by its folded path, while light and phone, reading after the crawl, name the
same page by its router pattern. The Shio run of 2026-09-28 lost dark exactly on pages
reached by an id and on create forms, which fits that cause but does not prove it. Since
VDS189 the census compares only the routes every view measured, so a naming split now
shows as a gap, keeps `--write` refused and drops the route from every figure. The fix
is to name the crawl's readings once the crawl ends: keep the page path on each reading
and resolve it against the final pattern set before the other views run, so all three
name a page the same way. If routes are still missing after that, the cause is in
loading or settling the page, and the `not read:` errors say which.

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

## Block C — One look across products

### §VDS182 A quieter surface: the chip for identity, tones for state

The layer's surfaces carry a lot of ornament at once. Frosted glass sits behind every
panel. A 34 to 48 px chip with a blue-to-indigo gradient appears on every tile and every
hero. Each product area gets its own tone, so a Shio console shows blue sites, green
users and violet groups, and the first tile of a list gets a double-size cell with a
radial glow. Each piece is reasonable alone. Together they are why a working screen
reads as a collage: colour appears everywhere and means nothing, so the one colour that
should mean something (the primary action, the current place, a state) has to shout over
it. The proposal keeps the layer's shapes and quiets its surface. The gradient chip
stays on identity only: the entity hero and a hub's tiles, where it names a thing. Rows,
list pages and form sections lose it. Tones stop being a per-area decoration and become
state: published, draft, scheduled, changed since publish and archived, drawn through
`BentoStatusMarker` as a dot and a word. The accent is reserved for the primary action
and "you are here". The emphasised double tile stops being automatic. The hero title
steps down to a size that leaves the fold to the work. The reference artboards now draw
it (solid cards, 16 px hero titles, the chip on hero only) and map states to tones:
published emerald, draft slate, scheduled violet, changed amber, archived neutral.
Components follow the review.

### §VDS192 A short table is short

With VDS183, a Shio admin list with one record, such as the single API token on a fresh
instance, renders a BentoDataTable whose panel runs about 450 px below its one 44 px
row, empty to the bottom of the viewport. The table mounts only the visible rows, so it
sizes its scroll container to the viewport rather than to its content. That is right for
a list of thousands and wrong for a list of one to a dozen, which is most admin lists.
The empty panel reads as a failure to load rather than as a short list, and it pushes
whatever the page puts below the table out of view. The same VDS183 contract promised
that an empty list is one inline card. The complement is that a short list is only as
tall as its rows. The table's height should be the smaller of its content and the space
available, with virtualisation engaging only when the rows exceed it.

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

### §VDS191 A place for the assistant's own settings

Shio lets each person choose what the assistant dock reports and whether the mascot
animates (its SH971). Those preferences belong to the dock, and the authoring contract
says a surface's own controls belong to the surface rather than to the header. But
neither the assistant nor the user menu has anywhere to put them. `VigletAssistant`
takes messages, reports, unread state and callbacks, and no action of its own.
`BentoUserMenu` takes the account, sign-out, organisations, tenant-admin, shortcuts and
tour routes and nothing else. So Shio renders the preferences as a bell-with-a-cog
button in the header, beside the tenant switch and the user menu. That reads as a second
notification affordance next to the mascot, which the 2026-09-28 review first took it
for. A product that wants the same thing, a reader choosing what the assistant tells
them, will make the same choice. The proposal is a slot on the assistant for its own
settings, such as an `onOpenSettings` callback drawn as a small control in the panel's
header. It keeps the header to the set the contract names, and it puts the choice next
to the thing it configures.
