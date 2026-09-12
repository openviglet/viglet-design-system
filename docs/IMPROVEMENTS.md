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

### §VDS135 The package as a Claude Code plugin

page-reference.mjs argues for copying: a contract kept in another repository is read
after the fifth screen, so the surfaces are written into the consumer where a session
trips over them. That argument holds for the artboards, which a consumer wants on disk.
It is weaker for the skill, which a plugin delivers into every session by name, updates
when the plugin does, and leaves no second copy to drift.

Ship .claude-plugin/plugin.json and a marketplace entry carrying the viglet-ds-pages
skill, a check command that runs the three bins against the working tree, and a
PreToolUse hook that runs the duplicate check against a component file as it is written,
which is when the instruction is cheapest to follow. Declare a supported package range,
because a plugin release train and an npm release train drift, and page-reference
already refuses to write when the vendored copy is ahead.

Shio's claude-plugin directory is the template, including its test asserting every path
in every manifest exists. Page-reference keeps vendoring the artboards and stops
vendoring the skill when the plugin is enabled.

### §VDS136 A catalogue an agent can ask

An agent building a Shio screen today decides between BentoPanel and
AdaptiveSectionCard, or between the dock and a toast, by reading dist type declarations
and the stories. exports.json tells it a name exists and nothing about what it is for,
what it must not be used for, or which contract rule governs it.

The plugin from DSF7 wires an MCP server generated from the installed dist, never
hand-written. Tools stay few because a tool list is paid on every turn: find a component
by job, and read one component's props, rules and example. The bulk text, the authoring
contract, the boundary and the token reference, is exposed as resources rather than
tools.

The token case must be made honestly or not at all, since this is only a win if the
vendored skill shrinks to a pointer. So the task lands with a budget file in the shape
Shio uses, measuring the tool list, the per-call cost of a lookup, and the skill it
replaces. A generation test fails when an exported component has no catalogue entry, so
the catalogue cannot fall behind the barrel.

### §VDS137 Contrast measured where a product re-keys

BENTO-AUTHORING tells a product to claim --primary through the four base inputs and
requires the solid fill to hold 4.5:1 on both grounds. The contrast gate measures the
preset's own pairs, found by a naming convention. A consumer's override is never
measured, and the accent family does not follow the convention the gate pairs by.

Shio shows why it matters: its accent is an orange claimed at :root, and the analysis
measured it near 3.6:1 as text and its primary button far lower on the dark ground. The
lints that exist in Shio assert that a token is set, not what ratio it reaches.

Generalise the gate into an exported measurePairs that takes a stylesheet and a ground,
resolves the custom properties the way the preset does, and returns every named pair
with its ratio. Add the accent family to the pairs it knows. Ship it through page-lint's
--contrast flag so a consumer runs it against its own override. The planted case is an
override one step too light, which must fail naming the pair and both grounds.

### §VDS138 A data table the contract can govern

The list shape the contract names is BentoListPage with a renderTile, which fits a dozen
sites or post types and not a folder of four thousand posts. Shio's content browser,
trash, static files, review queue and admin lists render their own tables, and none of
them shares virtualization, column choice, sorting, range selection or the keyboard
rules section 6 requires.

Export BentoDataTable over the table library both consoles already depend on:
virtualized rows, a column picker whose layout is a prop plus a persist callback the way
BentoListPage takes its layout, sortable headers announcing their sort, row selection
with shift-click and shift-arrow ranges, a selection action bar, and roving focus so a
row is reachable and actionable without a mouse. Row actions are a menu with named
items, never hover-only buttons.

It holds no data and no product vocabulary; the product passes rows, columns and
actions. Tests assert keyboard range selection, that only the visible window is mounted
at ten thousand rows, and that every row action is reachable by keyboard and named for a
screen reader.

### §VDS139 Filters, drawn once

A top-tier content list is filtered more than it is scrolled. Shio's planned query
vocabulary lets a curator ask for drafts of one type, in one locale, changed this week
by an agent, and the same questions recur in the review queue, the media library and the
activity trail. The package has a search input and nothing that renders a structured
filter, a removable chip or a saved view.

Export BentoFilterBar: a free-text field, a set of typed facets the product declares,
each rendered as a menu of choices or a date range, the active filters as removable
chips, and a clear-all. It takes a value and an onChange and owns no state, so the
product can mirror it into the URL, which is what makes a filtered view deep-linkable.
Saved views are a slot, not a store.

It depends on DSF10 because the table's selection must clear when a filter changes the
row set. Tests assert that every chip is a named, removable button, that facets are
keyboard operable, and that the bar emits one change per user action rather than one per
keystroke.

### §VDS140 One diff for every comparison a curator makes

Shio's round adds revision history with rollback, a review that shows what an agent
changed field by field, and a translation workspace comparing source and target. All
three put two versions of structured content side by side, and review of a created page
has to render the whole thing as additions rather than showing nothing.

Export BentoDiff, taking two values and a field schema and rendering a field-level
comparison: unchanged fields collapsed, text diffed by word, rich text diffed on its
rendered blocks rather than its markup, and a created or deleted side rendered as all
additions or all removals. Pair it with BentoVersionRail, a vertical list of revisions
with author, actor kind, a human or an agent, and time, from which two are chosen for
comparison.

Neither fetches anything. Tests assert the created-page case renders content rather than
an empty panel, that a change is announced by text and not only by colour, and that the
rail's selection is keyboard operable.

### §VDS141 The shell owns the region and the way past the rail

VDS125 fixed SubPage nesting a main inside SidebarInset's own, which was the console
era's form of this problem. The bento era has the opposite one: nothing emits a main at
all, so each product decides where the landmark goes, and Shio's analysis found a main
on three of its forty-seven pages and no skip link anywhere. Past a fixed rail and a
header carrying a palette trigger, a keyboard reader tabs through every chrome control
on every navigation.

BentoShell from DSF3 renders exactly one main, labelled, and a skip link as its first
focusable element, visible on focus, that moves focus into main. On route change the
shell moves focus to the page's h1 and announces the title, which is what a single-page
app owes a screen reader and what no page should implement for itself.

BentoEmptyState's title renders as a heading at the level its context declares, because
a styled div in one chrome and a heading in the other is a skipped level inside a shared
component. Tests assert one main, the skip link's target, and focus on navigation.

### §VDS142 A console verb with a name

Shio's first design law says every capability lands on the agent surface before the
console, and its conformance tests classify manifest features and mutating paths. They
cannot see a console action, because an action is a menu item with a label key and an
onSelect closure. The agent side names every verb: an op on shio_write, a tool, a batch
operation.

BentoActionsMenuItem and the entity shell's action slots gain a required id, typed as a
string the product declares, and render it as a data attribute. The package attaches no
meaning to it; it only guarantees that every action reaching the DOM carries a stable
name.

That is enough for a consumer to build the census: Shio can walk its declared console
actions and assert each id maps to an agent op or a classified exception, the same
Reason-with-a-falsifier shape its two conformance gates use. The change is breaking for
consumers that pass no id, so it ships with a codemod-free deprecation path: a missing
id warns in development for one release, then fails type-checking.

### §VDS143 Busy is not disabled

The package's buttons and the entity shell's save controls mark a pending action by
setting disabled. A disabled element leaves the tab order, so focus falls back to the
document body the instant a keyboard user presses Save, and the outcome, now reported
through a toast or the assistant's caption, is announced to someone whose place on the
page is gone.

The fix belongs here rather than in each product: while loading, a control sets
aria-busy and aria-disabled, stays focusable, ignores activation, and shows its spinner.
Only a control that is genuinely unavailable uses disabled. BentoFormHero,
BentoScrollSaveBar, BentoEntityShell and the base Button take a loading prop that
applies this, so no consumer has to know the distinction.

The test tabs to Save, activates it, and asserts that document.activeElement is still
the button while the promise is pending and after it settles, and that a second
activation during loading does not call the handler twice.

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
