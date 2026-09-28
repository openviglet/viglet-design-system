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

### §VDS180 A visual census across the bento consumers

A Playwright walk of all 45 Shio console routes on 2026-09-28 (dark, light and a 390 px
phone) measured what no check here asserts: fifteen visible button heights between 16
and 44 px, ten border radii, inputs at 36, 42 and 44 px, three monospace stacks, two
colours acting as the filled primary, and the page title starting at four x offsets.
Nobody has measured Turing and Dumont the same way, and that gap is the reason this task
exists. The package has already measured one kind of drift across its consumers:
`chrome:census` counts console-era imports in every entry of `consumers.json`, and
`viglet-ds-page-lint` reports a page that sets its own column. Neither reads a rendered
page. The deliverable is the instrument, before any change to the look. It is a census
that loads each bento consumer's routes in a browser and records, per route, the title's
offset, the heights of controls, the radii in use, the font families, the number of
filled primary buttons and whether the dock overlaps an interactive element. It then
separates what the package's own components render from what product code renders. That
split is the number every other line in this round needs, because it says whether a fix
belongs here or in a product. The first reading lands as the allowance, with the
offenders named, so each later task lowers a figure rather than claiming an improvement.

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

### §VDS184 An ancestor trail for nested content

A hero's way back is `BentoBackLink`: an arrow and the parent's name, small and
upper-case, above the title. For a two-level product that is enough, because the parent
is the list and the list is one click from the rail. A CMS is not two-level. In Shio a
post lives at site, then folder, then any depth of subfolders, and the same editor is
reached from the content browser, from search, from the review queue and from a
scheduled list. The back link names one parent and not where the reader is. The
2026-09-28 captures show the gap: the post editor's eyebrow reads "Voltar", the site
browser's "Sites", and the content browser moves the path into a toolbar panel below two
rows of buttons, a third place for the same information. The proposal is an optional
trail on the heroes. It is a list of ancestors rendered where the back link sits today,
each one a link, the last one being the current entity's parent, and truncated in the
middle past a width. It is passed the way `backTo` is passed, so the product still owns
the hierarchy, and the package draws it. It does not replace the back link: a route with
one parent keeps the arrow, and the authoring rule that an arrow promises a destination
still holds. The header's back control is unchanged. Turing and Dumont take nothing
until a surface of theirs nests.

## Block C — One look across products

### §VDS181 Labels on the rail, and a count on the item that owns one

The bento rail draws an icon per section and names it only in a tooltip and an
`aria-label`. That keeps the rail at 64 px, and the rail-to-hub-to-item structure behind
it is right: no level offers more than a handful of choices, and the header stays free
of a second nav. What fails is the first step. A reader has to recognise "content" or
"administration" from a glyph, and no glyph carries an abstract section reliably, so the
rail is learned by hovering. Recognition beats recall only when the thing to recognise
is visible. So the change is a short label under each icon, set in the rail's own type
step and kept to one line. The rail widens to whatever the longest label needs within a
declared ceiling, around 80 px, and still carries no second level, no groups and no
collapse state. The same change lets a nav item carry a count: an optional `count` on
`BentoNavItem`, drawn as a small badge on the item's icon. It is the answer to "what is
waiting for me" without a click, and it stays inside the rule that a surface's controls
belong to the surface: the badge sits on the destination that owns the count, never in
the header. Every bento consumer receives both at once, since the nav array is theirs
and only the rendering changes. Labels come from the `labelKey` sections already
declare; a section with none keeps the icon alone.

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
steps down to a size that leaves the fold to the work. The first artboards of this
direction are in the Shio concept canvas, and the reference artboards here are redrawn
from the preset's tokens before any component changes, so the decision is reviewed as
composition first.

### §VDS183 Record lists default to a table

`list.dc.html` draws the right discriminator: a reader who arrives to pick one gets
tiles, and a reader who arrives to compare many gets a table inside a panel, under the
same hero. The authoring contract states the default the other way. A list screen "is
one BentoListPage call with a renderTile", `renderTile` and `heroIcon` are required, and
the table is the exception a page argues for. Products follow the default. The Shio
console renders users, groups, roles, tokens, providers, webhooks and tenants as tiles,
which is records nobody picks by picture, where one user fills a 390 x 300 card and
fifteen sites become a mosaic in which the first is visually more important for no
reason the data gives. The change flips the default without removing tiles.
`BentoListPage` takes the columns and row actions that `BentoDataTable` takes and
renders a table under its hero, with the create action as the header's one primary and
`BentoFilterBar` above. Tiles become the variant a page opts into, for entities that are
genuinely visual or few: media, blueprints, a hub. The empty and one-row states get an
inline empty-state card instead of a lone tile. `BENTO-AUTHORING.md` and `list.dc.html`
are rewritten to say the same thing in the same order, and the census reports how many
record lists still render as tiles in each consumer.

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
