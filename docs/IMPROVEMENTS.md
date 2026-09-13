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

### §VDS156 An inline edit that loses its place and saves twice

VDS153's design asked for BentoInlineEdit's display button to trade disabled={saving}
for aria-disabled. Reading the component, that button never renders while a save runs:
commit sets saving and awaits onSave with the input still mounted, and saving and
editing both clear in the same batched update when it settles. The attribute is dead,
and the defects are elsewhere.

First, a keyboard commit drops focus. Enter commits, the save settles, editing turns
false and the focused input unmounts, so focus falls to the body at the moment the new
value lands. The display button that replaces it should take focus back when the edit
began from it or from the keyboard.

Second, a commit can run twice. While onSave is pending the input stays editable and its
blur handler is still commit, so pressing Enter and then tabbing away calls onSave a
second time with the same value, before the product has had the chance to update it.

Guard commit with a ref for the save in flight, so a second call returns at once, and
mark the input aria-busy while it runs. After a commit that the keyboard started, return
focus to the display button. Remove the dead disabled and opacity branches in the same
change. A jsdom test holds the single onSave call. A parity test holds the focus: in a
browser, press Enter in the field, settle the save, and read that the display button is
focused.

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
