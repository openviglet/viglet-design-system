# Improvements

## Block A — The gate the design system never had

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

### §VDS30 Return to TypeScript 7 when the lint can load it

typescript-eslint 8 throws on import against ts.versionMajorMinor >= 7, and the
documented side-by-side recipe needs the tool to resolve a second TypeScript, which a
peer dependency cannot be made to do. So this package moved from 7.0.2 to 6.0.3, which
also removed a real npm install conflict: i18next declares peerOptional typescript ^5 ||
^6, and npm treats that as hard, so a plain install failed and the publish workflow with
it. Nothing is lost today — 6.0.3 type-checks the same code. Watch typescript-eslint
issue 10940 and move back when it supports 7.1.

## Block B — Bento becomes a design-system layer

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

### §VDS37 The bento subpath's router dependency is unstated

Six of the leaves render a react-router-dom `Link`, so importing
`@viglet/viglet-design-system/bento` in a consumer without it throws `Cannot find
package 'react-router-dom'` -- observed while verifying the move against a fixture. The
manifest marks that peer optional, which is true of the root entry and false of this
one, and npm therefore warns nobody at install. The root keeps its router-dependent
components behind a `./router` subpath precisely so the root can stay router-free; the
bento layer now mixes both conventions in one entry. Either say so -- the README, and
the subpath's own doc comment -- or split the routed leaves the way the console era
already splits its own, and decide which before the shell and the palette arrive with
more of them.

### §VDS38 Let the palette match what a reader actually types

`BentoCommandPalette` filters on `t(item.titleKey)` and nothing else. Every entry also
carries a `descriptionKey` -- rendered right under the title in the same list -- and
typing a word from it returns an empty palette. "Crawlers and schedules" is on screen
beside "Indexing", and searching "crawler" finds neither. It came over unchanged because
a move must not also redesign, and the current behaviour is pinned by a test so widening
it is a deliberate change rather than a silent one. Match the description too, and
consider the section label: a reader who remembers "that thing under Generative AI" is
describing a real way people navigate. Worth doing before VDS19 gives the palette a
story, so the story shows the behaviour that stays.

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

### §VDS31 Dumont is the third consumer

The roadmap names Shio and Turing throughout, and the README's own first line names
three products. Discovering the consumers by reading their manifests found dumont-react
on the 2026.3 line alongside the other two. Nothing here is wrong for Dumont
specifically — it is that no line accounts for it, so VDS25's render contract compares
two token sets rather than three, VDS21's chrome strings are checked in two locale
bundles, and the duplicate lint is planned into two CIs. Decide whether Dumont is a
consumer this plan holds itself to, and if so widen those lines rather than adding a
parallel set.
