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

### §VDS168 A file compared by line

VDS140 gave the products one comparison, and roadkeep-gui now needs it for a source file
a Claude Code session changed, the original against the file now. `BentoDiff` has no
kind for that. A `text` field is one wrapped paragraph compared word by word, with no
line numbers, and `diffTokens` gives up past 400,000 cells, which a file of some forty
lines reaches; the field then draws the whole before removed and the whole after added,
which reads as a rewrite.

**A `lines` kind beside `text`, `rich` and `value`.** The value is a string split on
line breaks. The common head and tail are trimmed before `diffTokens` runs, so the
ceiling bounds the changed middle and not the file: one edit in a 5,000-line file is a
few cells. Past it, the field says the comparison was not made.

**Drawn as a file is read.** Monospace rows: the old number, the new number, a `+` or
`−` in text, then the line, in the tints `Added` and `Removed` already use. A removed
line followed by an added one is compared word by word inside, as an edited `rich`
paragraph is. Three unchanged lines stay around each change and the rest fold behind a
button naming how many. The field scrolls sideways, not the page, and Tab reaches it. A
missing side draws whole, numbered on one side, under the existing created or deleted
sentence.

No highlighting: a grammar per language is a parser the package would own for everyone.

### §VDS169 The original beside the change

VS Code opens a changed file side by side: the original on the left, the file now on the
right, unchanged lines level with each other. VDS168's `lines` kind draws one column,
which suits a narrow sheet and loses the reading a reviewer at a wide one expects.

**A `layout` prop, `"inline"` by default.** `"split"` applies to `lines` fields and is
ignored by the others, which have no rows to align. The product owns the switch, as VS
Code's editor toolbar does: `BentoDiff` draws either and keeps no state for it.

**Aligned by row, not by scrolling.** Each hunk becomes rows of two cells. Removed lines
fill the left and added lines the right, paired in order; where one side runs longer the
other gets an empty hatched cell, so the unchanged lines after the hunk stay level. A
pair is compared word by word on both sides. Each column carries its own numbers, and
the fold between hunks spans both.

**Lines wrap in split.** Two unwrapped columns need two sideways scrollbars kept in
step, a synchronised scroll the package would own and a keyboard reader cannot follow.
Wrapped, a row is as tall as its longer cell and the alignment holds.

**Narrow falls back.** Under a container width, read with a container query because a
sheet is narrower than the window, split draws as inline: two columns of a few words
each are harder to read than one.

### §VDS170 One mark for created, changed and deleted

`BentoDiff` names each field's state in a chip, Added, Removed, Changed or Unchanged,
tinted by the `bento-status` classes. A list of what changed needs the same words one
level up: roadkeep-gui lists the files an agent touched in the VDS167 `Tree` and is
about to mark each created, changed or deleted, as VS Code's source-control list does
with a letter. Drawn by the product, that mark picks its own colours and words, and the
list disagrees with the comparison it opens about what a change looks like, which VDS140
exists to prevent.

**`BentoChangeMark`, the chip lifted out of `FieldRow`.** `state` takes the chip's four
values; its words are the `bento.diff.*` keys the chip already reads, in both
catalogues, and its tints the same classes. `FieldRow` draws it, so the two cannot
drift.

**A letter where a row is narrow.** `compact` draws one letter, git's `A`, `M` or `D` by
default and a key of its own per locale, with the word as its accessible name and
tooltip. A letter is an abbreviation, so the name is what a screen reader says and what
a pointer reads.

**The `Tree` needs nothing.** A node's `label` is a `ReactNode`, so a product puts the
mark at the row's end. Striking a deleted item's name is the product's to draw: the mark
does not reach into the label.

Three states and nothing else cross the prop: no file, no path, no product's data.

### §VDS171 VigletAssistant forwards paused to its avatar

`VigletAvatar` takes `paused` and stops its motion while keeping its state readable, and
`PulseRing` does the same. `VigletAssistant` renders the avatar for its dock and
forwards `state`, `activity` and `unread`, but not `paused`. So a product that wants to
quiet the mascot has no way to say so short of re-implementing the dock around a bare
avatar, which the duplicate gate refuses.

Shio needs this for SH971. A curator who is presenting their screen, or who simply finds
the motion distracting, sets a per-person preference that the mascot stays still. The
caption and the aria-live announcement keep reporting as before; only the animation
stops. `prefers-reduced-motion` is the system-wide half of that, and this prop is the
per-product, per-person half.

The change is a `paused?: boolean` prop on `VigletAssistantProps`, forwarded to the
avatar and to any pulse the dock draws itself. It defaults to `false`, so nothing
changes for existing consumers. The assertion renders the dock with `paused` and reads
that the avatar received it and that no animation class is running, while the caption
still updates.

### §VDS172 A bento calendar over caller-supplied entries

No export of 2026.3.12 draws a date grid. Shio's Scheduled page (SH991) lists scheduled
publications as an agenda, and its design asked for a month and a week view with
rescheduling by dragging an entry to another day (SH1082). Building that grid inside
Shio is the second copy the duplicate gate exists to refuse. It is also the component
whose keyboard and screen-reader behaviour most needs checking once, in one place: arrow
keys across days, a focus that survives a month change, and a drop that is announced.

What a consumer needs is a bento-shaped calendar, not a date picker:
- month and week views over caller-supplied entries (`id`, `start`, `label`, an optional
  tone);
- a `timeZone` the grid renders in, since the page states the reader's zone;
- `onEntryMove(id, newStart)` that keeps the entry's time of day when dropped on a day;
- a keyboard path to the same move, so dragging is never the only way.

Entries come in and moves go out; the product owns the data and the write. The assertion
drives a keyboard move and reads the `onEntryMove` call, and axe stays clean in both
views.

### §VDS173 A two-pane page shape

The authoring contract names three page shapes, and none has two panes read side by
side. The primitives exist (`ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle`),
but a shape is more than primitives. It settles who owns the column, what the reading
width is inside each pane, and what happens at phone width, and those are the decisions
the contract exists to make once.

Two Shio pages want it now. The post editor's live preview (SH1094) sits as a card under
the form, so reading the page means scrolling away from the fields that change it. The
translation workspace (SH1061) wants source and target side by side.

Three things the shape has to settle:
- **The ratio**: the user drags it, and the shape remembers it per viewer. Browser
  storage is honest for that, since it is a convenience and not content.
- **Phone width**: two panes become one with a switch between them. The second pane
  never silently disappears.
- **Which pane scrolls**: each pane scrolls on its own, under one hero and one save bar
  that span both.

The assertion renders the shape at desktop and phone widths and reads two regions, then
one with a labelled switch.

### §VDS174 BentoDataTable takes a controlled selectedIds

`BentoDataTable` reports its selection through `onSelectionChange` and takes none in.
The same component's column `layout` **is** controlled beside `onLayoutChange`, so one
of the two was finished and the other was not.

Shio hit the gap in its content browser (SH1142, SH1148). The list view has had "select
every post in this folder" and "invert" since long before the table view existed. In the
table view the page cannot set the selection, so those two controls would tick nothing,
and Shio removed them rather than leave them inert. The page's set and the table's
ticked rows can only agree by habit today. Remounting the table with a `key` is not a
fix: it virtualises the rows of a four-thousand-post folder, and a remount throws that
window away on every click.

The change is `selectedIds?: string[]`. When it is given, the table is controlled: it
renders exactly those rows as ticked and reports changes through `onSelectionChange`
without keeping its own copy. When it is absent, the table behaves as it does now. The
assertion passes a set from outside, reads the ticked rows, then changes the set and
reads them again with no remount.

### §VDS175 The plugin finds a workspace installation

Measured in Shio after it enabled `viglet-ds` (SH944). The plugin's `.mcp.json` starts
the server as `npx --no-install viglet-ds-mcp`, and Claude Code runs it at the project
root. Shio installs the package in its `shio-react` workspace, not at the root, so the
bin is not on the root's path. `npx --no-install` then falls through to the registry and
answers `E404`. The skill's fallback sentence points at
`node_modules/@viglet/viglet-design-system/docs/`, which does not exist at that root
either. Turing and Dumont have the same layout, so this is the ordinary monorepo
consumer, not an edge case.

The hook and `/viglet-ds-check` already do the right thing: one resolves the package
from the file being written, the other from the package that installs it. The server
needs the same idea. It can start from a small launcher in the plugin that finds the
installation from the project root, the way `use:local` finds consumers: the register,
then workspace globs. Or it can take the consumer's package directory as an argument.
The skill's fallback should name the path it found, or say how to find one.

The assertion is the server answering `initialize` when started from a workspace-root
fixture that installs the package one level down.
