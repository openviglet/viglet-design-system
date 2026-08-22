# Improvements

## Block A — The gate the design system never had

### §VDS1 A test runner, before anything arrives that needs one

The package ships 45 UI primitives and 23 app-level components to two products and has
zero test files; vitest is not even a devDependency. Storybook is the only harness, and
a story asserts nothing. That was survivable while the components were thin wrappers
over Radix. It stops being survivable the moment the bento layer lands: twelve RTL
suites currently guard BentoEntityShell, BentoListPage, BentoFormHero, the command
palette and the nav rail from inside turing-app, and they cannot follow their components
into a package that cannot run them. Losing them would not be a neutral trade - those
suites cover the scroll morph, privilege gating and keyboard navigation, none of which a
type check sees. Add vitest, jsdom and Testing Library, wire a test script, and make one
existing component prove the harness works before VDS18 moves anything into it.

### §VDS2 A gate on the pull request, not on the install

The only workflow is publish.yml, triggered by workflow_dispatch. Nothing builds, lints,
type-checks or tests when a commit lands. Both Shio and Turing depend on
@viglet/viglet-design-system by caret range from npm, so the first thing that notices a
broken build is a product install, and the person who notices is not the person who
caused it. The blast radius is about to grow: after Block B this package owns the chrome
of two consoles rather than a handful of primitives. A workflow running install, tsc -b,
eslint and the new test script on every push and pull request is the minimum, and it is
the prerequisite for every other gate this block adds - the export manifest lint, the
accessibility sweep and the render contract all need somewhere to run.

### §VDS3 A local-dev path that exists

copy-ds.cmd in Shio writes to shio/shio-react/node_modules and the one in Turing to
turing/2026.1/frontend; neither directory exists any more, since the checkouts are
shio/2026.3 and turing/2026.3. So the documented way to try a design-system change
against a product before publishing has been broken for at least two version bumps, and
the fallback is to publish and see. That is exactly the wrong loop for a block whose
every task is a change to shared chrome that two consoles must be checked against, and
it is the loop this work would run several dozen times. Replace both scripts with one
supported recipe - a workspace link or a file: override - that resolves the checkout
rather than a hardcoded path, and state it in the README beside the install
instructions.

### §VDS4 The catalogue, somewhere an author can open it

Every component here carries a stories file, and storybook-static is built into a
directory nobody browses. A product author looking for a shared stepper, a sticky save
bar or a two-column form row has no address to look at, so the cheapest thing to do is
write one. That is not hypothetical: it is the mechanism by which an entire design
language - the frosted tile, the airy hero, the mosaic - grew inside one product while a
design system sat next to it exporting console chrome. Publish the built storybook per
commit on the default branch and link it from the README. It is also the surface VDS19
needs: bento stories that nobody can open buy nothing, and the catalogue is the only
place the two eras of chrome can be seen next to each other.

### §VDS5 Say what is exported, so a duplicate can fail a build

Nothing in this package declares its own export surface in a form a script can read.
Today the two consumers happen to be honest: all 24 of Shio's components/ui files and 39
of Turing's 59 are one-line re-export shims, and the rest are genuinely
product-specific. That is a good state reached by discipline, and discipline is not an
instrument. The moment a product needs a small variation, the fastest path is a local
copy, and nothing anywhere fails. Emit the export list as a build artefact and ship a
lint that a consumer runs in its own CI: for each locally declared component, if this
package exports that name, fail and name the import that replaces it. Land it before
Block B rather than after, because the instrument is what finds the call site nobody
read.

### §VDS6 Run the accessibility addon that is already installed

The storybook a11y addon is a devDependency and no job runs it. The bento layer arriving
in Block B carries an accessibility baseline written as prose in a conventions file:
icon-only controls need an aria-label, decorative glyphs need aria-hidden with an
adjacent screen-reader span, ARIA values must be string literals rather than boolean
expressions, and every animation must sit under the reduced-motion guard. Those rules
held across 118 pages because one team read one file. Rules that live only in a document
do not survive a second consumer who never opens it. Run the accessibility checks over
the story set in CI and fail on violations, so the baseline moves into this package as
an enforced property rather than as advice, and so VDS19's new stories are gate input
the day they land.

## Block B — Bento becomes a design-system layer

### §VDS7 Draw the line between the layer and the product

Turing's components/bento holds 23 components. Most are chrome: the hero, the form
section, the tiles, the mosaic, the save-bar morph, the rail, the palette. Some are not.
bento-activation-card, bento-quota-banner, bento-viglet-activation-dialog and
bento-no-llm-state are the shape of Turing's commercial offer, and moving them here
would put one product's business model into every product's chrome. bento-first-run-tour
sits on the line: the mechanism is generic, the content is not, so it moves only if it
moves data-driven. Decide the boundary once and write it down before any file is moved,
because the alternative is deciding it 23 times under time pressure and shipping a
package that the second product has to import around.

### §VDS8 A subpath, so the second era is opt-in

The package has one entry. Adding 23 components and 216 lines of CSS to it would put the
bento layer into the bundle of every consumer, including ones still on console chrome,
and would mix two eras of page shell in a single barrel with nothing at the import site
to tell them apart. Add ./bento and ./bento.css to the exports map, each with its own
build entry, its own type declarations, and sideEffects set so the CSS is preserved
while the JavaScript stays shakeable. The import then states which era a page belongs
to, which is something a reviewer and a lint can both see, and it is the shape VDS26
measures: a console-only consumer should be able to prove it paid nothing for a layer it
never imported.

### §VDS9 A tone is a token, not a class string

bento-tones.ts maps a tone name to hardcoded Tailwind colour classes, and the tonal icon
chip it feeds is the single most repeated visual in the layer - it appears in every
hero, every form section and every tile. Hardcoded, it means the palette a shared
component draws from is one product's palette. Shio's console today is orange: its page
header renders an orange-to-amber gradient chip inside an orange ring. A shared
component that names its own colours makes one of the two products look borrowed.
Express each tone as CSS custom properties in the preset, in the OKLCH system the rest
of the tokens already use, so a product re-keys the palette by redefining variables
rather than by forking a component, and so VDS23's brand accent has something to drive.

### §VDS10 The stylesheet is the look

bento.styles.css is 216 lines and none of it is decoration. bento-tile carries the hover
lift, the press and the spring entrance; bento-glass is the frosted surface; bento-grid
staggers its children; bento-shell-header animates the hero in; the bento-fade custom
property drives the save-bar morph. A consumer that imports the components without this
file gets flat cards - precisely the half-migrated look the conventions call the most
common mistake, and precisely what Shio's 42 Card call sites look like today. Move the
stylesheet behind the ./bento.css subpath, keep the reduced-motion block that disables
every one of those animations, and make that guard something VDS6's gate checks rather
than a comment somebody has to remember when adding a keyframe.

### §VDS11 The leaves, which everything else composes

Nine components are the vocabulary a bento page is written in: BentoHero,
BentoFormSection, BentoTile, BentoEntityTile, BentoSection, BentoCountTile,
BentoEmptyState, BentoStatusMarker and BentoActionsMenu. They depend on nothing of
Turing's beyond a router link, so they are the cheapest half of the move and the one
that unblocks the rest - the entity shell, the form hero and the list page are all
compositions of these. Move them behind the subpath with their props unchanged, and in
the same commit replace Turing's copies with re-export shims so all 118 bento pages keep
compiling untouched. The shims are the same pattern Turing already uses for 39
design-system primitives, and they stand until Turing's own block deletes them.

### §VDS12 The morph, which is the part nobody should re-implement

The hero-to-sticky save-bar transition is what most distinguishes a bento page from a
console page, and it has the most machinery behind it: a requestAnimationFrame loop
writing a bento-fade custom property on the document element, a sentinel, a spacer, and
a fixed bar that fades in exactly as the hero title leaves. It re-renders no React,
which is why it feels the way it does. A second console asked to reproduce that from a
screenshot will produce a permanently visible sticky bar, and it will be subtly and
permanently different. Move useBentoScrollFade, BentoSaveBar and BentoScrollSaveBar
together, and preserve the rule that the scroll bar has no consumer outside the two
compounds that own it - a rule one product already had to re-establish once.

### §VDS13 The gold standard, moved whole

BentoEntityShell is the largest single component in the layer and the reference every
detail page copies. It owns more than a layout: inline title and description editing,
the icon picker, the Active and Idle status pill, the delete flow, the read-only and
badge affordances, and the hero half of the save-bar morph. A page using it is a thin
wrapper around query hooks with the form supplied as a render prop. That is the property
worth exporting - not the frosted look, but the fact that a detail screen costs one call
and carries no shell mechanics of its own. Move it together with BentoInlineEdit and
BentoHeroIconPicker, which exist only to serve it, and keep the render-prop contract
exactly as it stands so no consuming page needs an edit beyond its import.

### §VDS14 The other half of the morph, for pages that own their hero

Not every form page can use the entity shell. A multi-section editor, a settings surface
or a suite page renders its own hero and still needs Save and Cancel to fade out of it
and fade into a fixed bar. BentoFormHero is the single drop-in for that: it wraps the
hero, injects the fading action pair into the trailing slot, and renders the scroll-bar
twin itself, so the two halves cannot drift apart - which is the failure it was built to
end, after a run of hand-wired two-piece forms that did. Move it with the actions escape
hatch intact for pages that save imperatively rather than by form submit. Shio needs it
immediately: three of its pages use a console sticky save bar today and none of them are
entity-shell shaped.

### §VDS15 The mosaic

BentoListPage is the largest file in the layer and it collapses a whole screen into one
call: the hero, the tile grid, the dashed New tile, the empty state, per-item emphasis,
the error and try-again path, and optional drag reorder. Every product has list screens
- Shio has at least ten - and a hand-rolled grid is the fastest way for two consoles to
stop matching, because a grid is where the small decisions live: column counts per
breakpoint, span multiples, what an empty result says and how a failure offers a retry.
Move it with BentoEntityTile, the tile shape it renders by default, and carry over the
constraint that spans stay in multiples of two so the mosaic reflows cleanly at every
breakpoint.

### §VDS16 A shell, so a page is not bento inside a console that is not

The bento shell has no sidebar provider and no breadcrumb bar; it has a desktop-only nav
rail, a user menu and a back-to-top control, with the rail's gutter reserved by the
layout. That matters more than it sounds: any component reaching for the sidebar context
renders blank or crashes inside it, which is the tripwire that catches a page still
reusing console chrome. Without the shell a second product can import every tile in this
layer and still ship an airy hero bolted onto a console sidebar - the half-migration the
conventions name as the first mistake. Move BentoNavRail, BentoUserMenu and
BentoBackToTop together with the shell layout they assume, and state the no-sidebar rule
where a consumer meets it rather than in a file it will not read.

### §VDS17 A generic palette over product-supplied data

bento-nav.config.ts is 15 KB and it is two things at once: the command palette's
behaviour, which is generic, and the list of one product's roughly 29 surfaces, which is
not. Moving the file whole would put Turing's routes into Shio's palette; leaving it
whole means Shio writes a second palette that drifts from the first. Split it. The
package exports the palette, the shortcuts dialog and a typed schema for a nav entry -
label, icon, route, group, keywords, required privilege - and each product supplies its
own array. The rail from VDS16 reads the same array, so a surface is declared once and
appears in both the rail and the palette, which is the property that made the palette
worth having in the first place.

### §VDS18 The suites follow their components

Twelve RTL suites sit in the bento tests directory, covering the entity shell, the list
page, the form hero, the command palette, the nav rail, the quota banner, the first-run
tour, the activation card, the empty state, the status marker, the shortcuts dialog and
the nav config. They assert what types do not: that the morph appears on scroll, that a
privileged action is hidden from a user without it, that the palette is arrow-key
navigable, that a tile links where it claims. If the components move and the suites do
not, each of those becomes a regression two products discover separately at runtime.
Move the suites for the components that moved, leave the ones covering product-specific
tiles behind, and adapt their mocks - the user context and the i18n passthrough both
have package-level equivalents.

### §VDS19 A story for the newest layer

Every other component in this package carries a stories file; not one bento component
does, because the layer grew inside an application rather than inside a library. That
gap is why the catalogue from VDS4 will not answer the question a Shio author is about
to ask, which is not whether a hero exists but what a hero looks like with an eyebrow, a
tonal chip, a subtitle and two trailing actions. Write a story per moved component: the
tone variants side by side, the list mosaic with and without items, the empty and error
states, and a scroll-morph story long enough to actually scroll. These are also what
VDS6's accessibility sweep runs over, so they are gate input rather than documentation
alone.

### §VDS20 The rules move with the code

CONVENTIONS.md is the reason the bento layer stayed internally consistent across 118
pages. It fixes the three page shapes, forbids a hand-rolled sticky wrapper, puts
identity fields in the hero and never in the form, requires the back-link arrow, sets
the grid spans, and states the i18n and accessibility baselines. It is addressed to one
product and it lives in that product's tree. A second console will not read it, and
rules nobody reads are how two consoles drift apart while both teams believe they are
following the same design. Rewrite it as this package's authoring contract -
product-neutral, sitting next to the components it governs - and leave a pointer behind
in Turing rather than a copy, because two copies of a contract is the same failure one
level up.

### §VDS21 Chrome that speaks its own strings

The package already ships English and Portuguese base translations for buttons, form
labels, dialog text and navigation, and it already exposes a register function so a
product merges its own on top. The bento chrome breaks that arrangement: the palette's
placeholder and no-results text, the rail's labels, the shortcuts dialog and the save
bar's Save and Cancel all read from one product's bento namespace. Imported elsewhere
they render raw keys. Move the chrome-only keys into this package's locale bundle in
both languages, keep the object-form default convention so a missing key still renders
as words rather than as an identifier, and leave the entity strings - what a thing is
called - with the product that owns the entity.

### §VDS22 One form, two chromes, no duplicated fields

Turing already solved the hardest problem in a migration of this kind, and solved it
locally. Its SectionCard chrome provider lets a form written once render as console
section cards or as frosted bento form sections depending on a provider at the top of
the page, so a heavy form with real field logic moves between chromes without its fields
being copied. Shio needs it more than Turing does: the post editor, the post-type editor
and the site editor are the largest forms in that product and exactly the ones a
parallel bento route would otherwise fork. Move the adapter here, next to both
components it switches between, and keep the console branch working for as long as the
console chrome is still exported.

## Block C — One look across products

### §VDS23 Brand accent as a token, not as a class

One look across products is not one colour across products. Shio's page header renders
an orange-to-amber gradient chip inside an orange ring; Turing's glass card tints its
shadow from a blue custom property and its bento tones lean indigo. Both are correct,
and both are spelled in the wrong place - as utility classes inside components, some of
which are now shared. The result is that adopting a shared component today either
imports the other product's hue or forces an override at every call site. Define a
single brand accent as tokens in the preset, with the tint, the ring and the gradient
stops derived from it, and let each product set it once at the root. A shared component
is then neutral by construction, and the two products differ only where they should.

### §VDS24 Say which era a component belongs to

After Block B this package exports two complete page vocabularies. PageHeader, SubPage,
SubPageHeader, GridList, InternalSidebar, NavMain and StickyPageHeader are the console
era; the bento subpath is the current one. Nothing in the package says so. A new page -
in a third product, or in a corner of an existing one - will pick whichever it finds
first, and the drift this whole effort exists to close reopens quietly and without
anyone deciding to reopen it. Mark the console set deprecated in its own doc comments
and in the README, publish the swap table the migration already carries as prose, and
keep every one of them exported and working until both products have finished cutting
over. Removal is a later decision and deserves its own line.

### §VDS25 Prove the two products render the same

The goal of this work is a claim about appearance, and appearance is the one property
nothing in either repository checks. The evidence today is a person opening two
browsers: expensive, not run on a pull request, and unable to say what changed. Build a
cheap textual proof instead. Render a fixed set of compositions - a hero, a form
section, an entity tile, a list mosaic - under each product's token set, and emit a
digest of the resolved layout and computed styles. Two products sharing the layer should
differ only where a brand token says they should, and the digest names the exception
when they do not. It runs in the CI from VDS2, and it is what turns one look from an
intention into an asserted property.

### §VDS26 Measure what the subpath was chosen for

A subpath export was preferred over a single barrel on the argument that a consumer
still on console chrome should not pay for the bento layer. That argument is currently
unmeasured, and an unmeasured argument about cost is the same defect as a premise
carried in a comment: it fails quietly, in somebody else's build. Add a size check to CI
that builds a fixture importing only from the root entry and asserts that no bento
module and no bento CSS reaches the output, plus a recorded baseline for the bento
subpath itself so a component moved here without care surfaces as a number rather than
as a feeling. Land it with the subpath rather than after it, so the first regression is
caught by the gate and not by a product.
