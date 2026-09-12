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

### §VDS149 One binding set for the palette and the guide that lists it

BENTO-AUTHORING puts the palette trigger, with the platform's own key hint, in the
header's set, and the package ships the palette and the shortcuts dialog but neither the
trigger nor the binding. So Turing's shell and Shio's each write a platform check for
the Cmd or Ctrl hint, a button, and a window keydown listener that ignores keys typed
into a field.

They agree on Cmd+K and on nothing else. Turing binds ? to the shortcuts dialog. Shio
binds / to the palette and never binds ?, while mounting BentoShortcutsDialog, which
lists ? as a global shortcut and does not list /. Shio's typing guard counts a select
and Turing's does not.

Export BentoPaletteTrigger, the button with the hint, and a useBentoShellShortcuts hook
taking onPalette and onShortcuts, which owns one binding set and one typing guard. The
dialog reads the same set, so what it lists is what is bound. The tests assert that the
hook ignores a key typed into an input, a textarea, a select or a contenteditable, and
that the dialog's rows are the hook's bindings. Whether / belongs in the set is the one
choice to settle while building it.

### §VDS150 Purposes the catalogue can read

dist/catalogue.json takes a component's purpose from the doc comment on its own
declaration, and writes an empty summary where there is none rather than inventing one.
Measured at the build that shipped the catalogue: 45 of 237 components are described.
find_component ranks the other 192 by name, prop names and the contract sections that
name them, which works for BentoPanel and fails for a job worded differently from the
component's name. read_component answers them with no description at all.

Two parts. First, write the missing comments, first sentence as the purpose and a
sentence on what not to use it for where a sibling does that job, starting with the
bento layer and the components the contract names, since those are the ones an agent is
sent to choose between. Second, a ratchet so the count cannot fall back: check-catalogue
reads a list of the components still undescribed, fails when a component outside that
list has no summary, and fails when a listed one has gained a summary and was not
removed from the list. A new component then arrives described or does not build, and the
list only shrinks.

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

## Block G — The package knows one chrome

### §VDS144 A census for the cutover the non-goal waits for

Two standing non-goals protect the console chrome: do not make bento the only chrome
this package knows, and do not remove the console-era exports before every console cuts
over. The first names a reason that is spent, Shio migrating behind a parallel route,
which finished. The second is sound, and uncheckable: every console cuts over is a
condition nobody can observe, because the chrome field in consumers.json is typed by
hand.

Measured over source, excluding installed copies: Shio renders no console chrome and is
declared console; Dumont imports SectionCardChromeProvider 64 times, GridList 48,
SubPageHeader 37 and useSectionChrome 24 while also importing ./bento in 44 files; the
cloud checkout imports no console-era component at all.

So the chrome field becomes measured. A census reads each consumer's declared
sourceRoots through its checkout, counts imports of the console-era exports, and fails
when a consumer declared bento imports any, or one declared console imports none. It
prints the per-consumer count on green. Every removal task below depends on this reading
zero consoles, which turns the non-goal from a promise into a gate.

### §VDS145 The default belongs to the chrome that is staying

bento-section-chrome.tsx declares SectionChrome as console or bento and creates its
context with console as the default. A consumer that has finished migrating pays for
that on every route: Shio's App.tsx wraps about twenty-five route elements in
SectionCardChromeProvider chrome=bento, and its EmptyState documents that a component
rendered under no provider, on a login, setup or not-found page, concludes there is a
console chrome to render into.

The cost of the default should fall on the product that still needs the old chrome, and
it would fall once rather than per route. Flip the default to bento. A console consumer
sets chrome=console at its root in one line; the census from DSG1 names exactly which
consumers that is, so the release note can say it instead of hoping.

This is a breaking change for those consumers and ships as one: the changelog names the
line to add, and a test asserts that a component under no provider renders bento. It is
also the step that lets a bento consumer delete its wrappers before the switch itself is
gone.

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
