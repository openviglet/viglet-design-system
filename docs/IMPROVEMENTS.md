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

### §VDS165 The alias the census reads past

`measureConsumer` makes two passes. The first collects the console-era names a consumer
can reach, adding each import clause's *alias*; the second counts files importing a
reachable name, reading each clause's *original* name. For `import { SubPage } from
"…/router"` the two agree. For `import { SubPage as SharedSubPage } from "…/router"` the
first pass records `SharedSubPage`, the second asks for `SubPage`, and the file counts
as nothing.

That is not hypothetical. Turing's `components/sub.page.tsx` bound a density onto the
package's `SubPage` exactly that way, and the census read zero console-era imports
across all nine consumers — the reading VDS147 removed eleven components on. Turing's
build broke on the file the day it moved to 2026.3.11. Nothing imported the shim, so it
was deleted rather than ported, but the reading was wrong and the next alias will be
wrong the same way.

A direct import of the same name elsewhere in the consumer hides it: the unaliased
clause puts `SubPage` in the reachable set, and the aliased file then matches. So a
fixture holding both passes, and only an aliased import on its own reproduces it,
measuring zero.

The fix is to count a file when any clause imports a console-era name from the package,
aliased or not, and keep the alias set for what it is for — following a shim's re-export
into the pages that take it. The fixture that proves it is the aliased import alone.

### §VDS166 The census walk and its deadline

`chrome-census.test.ts` holds the real register to the real checkouts where a machine
has them: it walks the declared source roots of all nine consumers — Turing's alone is
over seven hundred files — and it runs under Vitest's default five-second timeout.

On a warm filesystem that is plenty. The first run after the checkouts had been
reinstalled failed that case while running beside two other script test files, and the
next two runs of the same three files passed with no change in between. Nothing in the
assertion moved; the walk outran the deadline.

This is the shape VDS148 fixed one file over, where importing `vite.config.ts` took ten
times longer beside the browser project than alone: a constant sized for a quiet
machine, failing with every assertion intact. It is also a gate that reads as flaky
while it is really slow, which is the reading that teaches people to re-run a red census
instead of reading it.

The repair is VDS148's: size the case for the loaded suite, with a comment saying what
the walk costs and why, rather than widening it until it stops failing today. Measuring
the walk once cold and once warm gives the number the comment should carry.

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
