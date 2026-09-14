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

### §VDS162 The red nobody can read

One full run of the suite turned two `parity (chromium)` files red together: the tooltip
delay test and the inline-edit focus test. Both passed alone straight afterwards, and
the suite has run green seven times out of eight since. The message was not captured,
which is itself the finding — a failure nobody can read is one nobody can act on.

Two at once, in one project, is what makes this worth a line. VDS157 replaced a fixed
sleep in one file with a lower bound measured from before the pointer moves, which a
busy machine can only make larger; VDS153 and VDS156 did comparable work on the other.
So the red is unlikely to be either assertion and much more likely to be the deadline
around it: every wait here is a timeout against one shared browser, and when that
browser stalls, each test waiting on it runs out at once.

That is the same defect VDS157 named one level down: a constant sized for a machine
other than the one running it. The difference is that it now sits in the harness rather
than in an assertion, where no single test can fix it.

What is needed first is the message. A reporter that keeps the failure output of a
parity run — or a retry that records what it retried rather than hiding it — turns one
unreproducible red into a report naming which wait expired. Sizing anything before that
is guessing at which number was wrong.

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

## Block G — The package knows one chrome
