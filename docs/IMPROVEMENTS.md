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

### §VDS157 The tooltip delay parity test, under load

`src/components/ui/tooltip.parity.test.tsx` sleeps 150ms after the hover and asserts the
bubble is not shown yet, then polls for it. That is the shape of the assertion VDS154
needed: a provider's delay reaches the tooltips under it, so something must fail while
the delay is still running.

The 150ms is the part that does not hold. It is a fixed sleep sized for an idle machine,
and the browser project runs beside 159 other test files: across four full runs of the
suite during VDS147 it failed twice at `expect(bubbleShown()) .toBe(false)` — the bubble
was already up — and passed three times out of three when run alone. So the failure
carries no information either way, which is worse than no test: a delay that genuinely
stopped reaching the tooltip would print the same line everyone has learned to re-run.

The repair is the one VDS148 made to a timeout one directory over: stop sizing a
constant for a machine that is not the one running it. Read the clock across the hover
instead of sleeping against it — assert the bubble appeared no earlier than the
provider's delay, measured from the event — or drive the delay with fake timers so the
wait is not real at all. Either way the assertion stays what VDS154 wrote it to be, and
stops being a race with the rest of the suite.

### §VDS158 The README's lists, against the surface it ships

`## What's Included` is where a product author looks first, and both its lists are typed
by hand. The UI Primitives one is accurate today — 41 names under a heading that says
41. The App Components one is not: it names ten, while `src/components/index.ts` exports
`AppSwitcher`, `BackendStatusBanner`, `BackendStatusProvider`, `ErrorBoundary`,
`LanguageSwitcher`, `ModeToggleSidebar` and `VigletAppSwitcher` too, and
`src/components/login` and `src/components/startup-first` export their own compounds
beside them. It also carried a parenthesised count of 23 that matched neither its own
list nor the export set; VDS147 removed the count rather than guessing a new one, which
leaves the list wrong and no longer claiming a total.

Nothing checks either list, which is why one drifted and the other happens to be right.
The package already knows the answer: `dist/exports.json` is the surface per entry,
emitted every build, and `check-catalogue` already holds a generated artefact to it. The
same shape fits here — read the names out of the README's lists, compare them against
the entry they claim to describe, and fail on a name shipped and unlisted. The reverse
direction matters as much: a name listed and no longer exported is what a removal like
VDS147 leaves behind.

A curated subset is a defensible thing for a front door to be, but then it has to say
so, and the gate becomes a cap on what may be omitted rather than an equality. Deciding
which of the two this section is, is the first half of the work.

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

### §VDS146 Removing the switch, and the non-goal that kept it

The chrome switch was the right tool for a migration: one component rendering two looks
from one set of fields, so a page could move between shells without its form being
rewritten. With the migration over in every consumer the census reads, the switch has no
second value to choose. What stays is SectionChrome, SectionCardChromeProvider,
useSectionChrome, the console branch inside AdaptiveSectionCard and BentoFormSection,
and the tests asserting both halves.

Dead branches in a shared package are not harmless. A new component copying the adapter
pattern inherits a chrome parameter that means nothing, and a consumer reading the
barrel learns there are two chromes when there is one.

This task lands only when DSG1 reads zero console consumers, which in today's numbers
means after Dumont's own cutover. It removes the type, the provider, the hook and every
console branch, keeps AdaptiveSectionCard only if it still differs from
BentoFormSection, and drops the non-goal about bento being the only chrome. The
consumers.json chrome vocabulary loses the console value in the same commit, so the
census cannot be satisfied by a declaration nobody measured.
