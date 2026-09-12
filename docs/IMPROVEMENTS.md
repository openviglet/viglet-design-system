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

### §VDS153 The layout editor keeps its place too

VDS143 gave Button and GradientButton a loading state that keeps focus, and moved the
save controls of BentoFormHero, BentoSaveBar and BentoEntityShell onto it. The layout
editor in BentoListPage still marks its own save in flight with disabled={busy} on all
four of its buttons: reset, set as default for everyone, cancel and save layout. A
reader who presses Save layout from the keyboard loses focus as the layout persists, the
defect VDS143 fixed one component over, and bento-list-page.test.tsx asserts the
disabled attribute that causes it.

Pass loading={busy} to the button that was pressed and aria-disabled to the other three
while it runs, so none leaves the tab order, and change the test to assert aria-busy,
focus kept, and a second press ignored. BentoInlineEdit disables its display button
while a commit is saving; since focus has already left the field by then, give it
aria-disabled with the same treatment rather than the attribute.

### §VDS154 A provided tooltip delay that nothing reads

Tooltip in src/components/ui/tooltip.tsx wraps its Radix root in a TooltipProvider of
its own, whose delayDuration defaults to 0. Radix reads the nearest provider, so that
inner one always wins, and a provider a product or a component places around its
tooltips sets a delay nothing reads. BentoNavRail wraps the rail in TooltipProvider
delayDuration={200} so a pointer travelling down the rail does not flash every label on
the way; every label still opens at once. The pattern came from upstream shadcn, which
is why it looks deliberate.

Build the fix in the Tooltip wrapper, not in the rail. TooltipProvider sets a small
context of its own beside the Radix one, and Tooltip mounts its inner provider only when
that context is absent, so a lone Tooltip keeps working with no provider and a provided
delay reaches every tooltip under it. The rejected alternative is a delayDuration prop
on every Tooltip, which puts the same number on each call site and leaves the provider
documented as doing something it does not.

A browser test in the parity project holds it: a Tooltip under a provider with a delay
is not open immediately after hover and is open after the delay, and a Tooltip with no
provider opens at once. Update the TooltipProvider doc comment, which currently records
the defect as the behaviour.

### §VDS155 First sentences that are not purposes

VDS150 put a doc comment on every exported component, and check-catalogue now fails a
component without one. It cannot judge whether the first sentence says what the
component is for, and five of the comments written before it do not.

BadgeColorful opens with why its text is never treated as markup. NavigationMenu and
Toaster open with the fix that named their landmark, which the catalogue's readable pass
reduces to a lowercase fragment. BentoStatusMarker's first sentence ends in a colon, so
its summary stops mid-list. UserAvatar repeats its own name before saying what it is.

Rewrite each first sentence as the purpose, keeping the note that was there as a later
paragraph, since each one records a real decision. Then rebuild and read the five
through find_component. A mechanical check is not part of this: whether a sentence names
a purpose is a reading, and a rule that a summary starts with a capital would fail the
many correct comments that open with a roadmap id.

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

### §VDS147 The console-era exports, retired

src/components/router still carries the console era's page vocabulary: PageHeader,
SubPage, SubPageHeader, StickyPageHeader, GridList, InternalSidebar, NavMain, NavUser,
Page, PageContent and BlankSlate. They were deprecated rather than removed because they
rendered live screens in every console, and the non-goal about console-era exports holds
removal until every console cuts over.

With DSG1's census as the condition and DSG3's switch gone, that condition is finally a
number rather than a belief. Remove the components, their stories and tests, and their
entries from the published exports, and let the size and exports gates record the entry
shrinking. Anything still worth keeping from them, a sticky title or a blank slate, has
a bento counterpart or becomes one first as its own line, per the non-goal against
redesigning a component while moving it.

The assertion is the exports gate itself: none of the eleven names resolves from any
published subpath, and the census, run once more, still reads zero. The standing
non-goal is then closed rather than edited, with the census recorded as what satisfied
it.
