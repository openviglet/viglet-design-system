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

### §VDS56 The leftovers of the useIsMobile rewrite

`useIsMobile` used to copy a media query into `useState` and let an effect catch it up.
It was rewritten to `useSyncExternalStore` because that returned the desktop answer on
the first render whatever the viewport was, and corrected one commit later — a layout
flash on every mobile load. Its own comment says so.

Two places still do it.

`useDensityFactor`, in `floating-formulas-bg.tsx`, starts at `1` — full density — and
computes the real factor in an effect. On a phone the first paint is therefore 35
drifting terms, every bond and three blurred orbs, which is precisely the "many animated
+ blurred layers at once" its own doc comment says mobile GPUs flicker on, and only then
does it drop to a quarter of that. The mitigation misses the paint it exists for, and
pays a second full render to get there.

`BentoBackToTop` starts `false` and reads `window.scrollY` in an effect. A page restored
to a saved scroll position, or opened on an anchor, renders without the button and then
pops it in.

Neither is caught, and that is the part that belongs to this block.
`react-hooks/set-state-in-effect` is an error here — VDS28 promoted it for this exact
shape — and it fires on neither, because in both the `setState` sits inside a named
function the effect calls rather than in the effect body. A rule that matches on syntax
stops at one level of indirection, so the gate reports clean over the defect it was
turned on to name.

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
