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
