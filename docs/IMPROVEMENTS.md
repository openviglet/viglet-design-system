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

### §VDS177 The README test and a stale dist

`scripts/check-readme.test.ts` ends with a block that holds the real README against
`dist/exports.json`, skipped when there is no `dist`. It is not skipped when `dist` is
there but stale, and the gate order this project documents runs `npm test` before `npm
run build`. So the commit that adds a component and lists it in the README fails the
suite: the README names an export the old `dist` does not have. The failure reads as a
README defect, and it clears only after a build that the test itself never asks for.

VDS172 hit it with `BentoCalendar`. VDS69 fixed the same shape in another test, which
failed on every clean checkout because it read `dist`.

The build already runs `check-readme.mjs` against a `dist` it has just emitted, so this
block adds nothing the build lacks, apart from a false red between the two steps. Two
repairs would work. Skip the block when `dist/exports.json` is older than the newest
file under `src/`, and name the skip. Or derive the surface from source, as
`exported-surface.test.ts` does, so the reading never depends on a build. The second
keeps the check honest on a clean checkout as well, and matches VDS69's choice.

### §VDS179 The accent label on its tints

`src/styles/contrast.test.ts` measures every named token pair on both grounds, plus the
pairs a name cannot derive: the page, muted text, the accented label on the page, and
white on the accent fill. It does not measure the accented label on the accent's own
tints, `--vg-accent-surface` and `--vg-accent-surface-strong`. The icon picker draws
exactly that pair: its hover state is `--vg-accent-fg` on the strong tint, and so is its
selected cell.

VDS176 found it, once story tests could see the styles. The brand-accent story's strong
tint measured 4.11:1 in light mode, and the preset's `--vg-accent-text` went one step
deeper to hold it. Nothing prevents the next re-key from failing the same way: a product
that keys `--vg-accent-text` to a colour that passes on the page can still fail on the
tints, and the gate would stay green.

The tints are `color-mix` over the accent with `transparent`, so they are not opaque
until they are laid over the page. The repair is to compose each tint over
`--vg-background` for its ground, and to measure `--vg-accent-fg` on the result as two
more pairs. Then the re-key check in the same file, which already measures a product's
accent, covers the tints as well.

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

### §VDS178 The fourth shape on the canvas

`docs/BENTO-AUTHORING.md` closes by pointing at `docs/reference/`: eight artboards, one
per decision, for when "a sentence here is clear and you still cannot picture the page
it describes". VDS173 made the two-pane screen the contract's fourth page shape, and the
contract, the README and both skill texts now say four. The canvas still draws three.
Its page-shapes artboard text in `docs/reference/canvas.json` reads "one of three shapes
plus data", and no artboard shows `BentoSplitPage`.

The two-pane shape is the one that most needs a drawing. What the contract decides is
spatial: the hero and the save bar span both panes, each pane scrolls within the height
under them, the handle sits between the panes, and at phone width a switch replaces the
second pane. A sentence states all four, but only a picture shows a reader where each
one sits.

The repair is to add the shape to the page-shapes artboard with the same hand as the
other three, desktop and phone, and to correct the artboard's count. If the canvas has a
generator, add the shape there so a rebuild keeps it.
