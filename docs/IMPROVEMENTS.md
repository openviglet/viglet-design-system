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

### §VDS53 A React console error is not a test failure

`Accordion` is `AccordionPrimitive.Root` re-exported. Radix reads `collapsible` only
when `type` is `"single"`; under `type="multiple"` the prop is not part of the
component's contract, so it falls through to the underlying `div` and React refuses it:

> Received `true` for a non-boolean attribute `collapsible`.

The story supplies it. `meta.args` sets `collapsible: true` for the single-type default,
and `Multiple` overrides `type` alone, so it spreads the inherited `collapsible` into a
root that has no use for it. TypeScript does not object: `meta` is typed against the
union of both variants, and the override is checked against that same union rather than
against the narrowed one the story actually renders.

Two things are wrong, and the second is why this belongs to the gate block. The story is
the catalogue a product author reads before writing a fourth accordion, and it currently
demonstrates a prop the component does not accept in that mode. And `npm test` printed
the error and exited 0 — 742 passing tests over a component rendering an invalid DOM
attribute. A React console error is a defect the framework already found for us; letting
it scroll past means every future prop leak arrives the same way, as noise in a green
run.

Fixing the story is a line. Making the suite fail on it is the task: the gate should
treat a React error logged during a test as the test failing.

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
