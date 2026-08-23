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

### §VDS57 The rule catches the shape nobody writes

VDS28 promoted `react-hooks/set-state-in-effect` to an error. VDS56 then found two
components doing exactly what it names, both of which it had reported clean on for as
long as they existed.

A probe of the three ways to write the same defect settles why. Given `useEffect` with
`setN(window.innerWidth)` in the body, the rule fires. Move that identical call into a
`function update() { … }` the effect calls, or an arrow assigned to a const, and it
fires on neither. One level of indirection is the whole difference — and the indirect
form is the one anybody writes, because it is what a listener needs: you name the
function so you can hand it to `addEventListener` and remove it again.

So the rule catches the shape nobody writes and misses the shape everybody does. That is
worse than it being off, because a clean run is read as evidence.

VDS56 left two tests standing in its place, and they are better evidence than a lint
rule: they hold the painted frame rather than the syntax behind it. But they guard two
components. A third written tomorrow is unguarded, and the two that were fixed had been
wrong since they were written.

What closes it is a check that reads what an effect *reaches* rather than what it
contains — call-graph awareness, a compiler diagnostic, or a lint rule of this project's
own. Which is affordable is the task, and finding that none is would also close it, in
the ledger.

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
