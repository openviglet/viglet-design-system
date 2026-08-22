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

## Block C — One look across products

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

### §VDS39 Re-key at the root, and let the story show it

The brand accent's derived tokens - the tint, the strong tint, the hairline, the
interactive fill - are `color-mix` over `--vg-accent-from` declared on `:root`, so they
are substituted there. A utility class that mixes inline re-keys anywhere; a pre-derived
token does not. Setting the four on a nested wrapper therefore re-keys the chip and the
solid fill and leaves the tint and the hairline at the root's value.

The README states the contract correctly - set them at the root - but the `Re-keyed`
story sets them on a `<div>` and presents the result as a re-key. Two of its five
specimens do not move, and the one place a consumer goes to learn the mechanism teaches
a form that half-works. The render-parity digest hit the same wall and had to move its
tokens to the document element before it could assert anything.

Make the story re-key the way a product does, and say in the preset - where somebody
reads the token, not only in the README - why the root is not merely a convention.
