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

### §VDS67 Options taken on trust

`vigletBootLoader` is a build-time plugin four products configure by hand, and every
option is interpolated straight into CSS or HTML. Four measured behaviours, all silent.

**A title containing `$` loses text.** `html.replace(placeholder, markup)` passes
`markup` as a *replacement string*, where `$&` means the matched text. A title of `Cost
$& Billing` renders as `Cost <!--viglet-boot-loader--> Billing` — the plugin re-emits
the placeholder it was replacing, and `escapeHtml` does not cover `$`. The `#root`
fallback below already avoids this by passing a function.

**A named colour renders two accents.** `color` reaches the gradients raw, while
`hexToRgbTriplet` parses it for the rgba tints and returns `null` for anything outside
`#rgb` and `#rrggbb`, falling back to a hardcoded `37, 99, 235`. So `color: "royalblue"`
is honoured in the gradients and silently replaced with blue in the glows: one option,
two colours. `royalblue` is valid CSS.

**A prefix that is not an identifier injects CSS.** The doc says "letters, digits and
`-`" and nothing checks. A prefix of `x{} body{display:none} .y` puts `display:none` in
the stylesheet — a typo landing as broken CSS rather than an attack, but the constraint
is documented and unenforced.

**Neither the placeholder nor `<div id="root">` means no loader and no warning.** Both
replacements miss, the markup is dropped, the build succeeds. A product renaming its
mount point loses the loader with nothing to read.

The file has no tests, and every product's `vite.config.ts` calls it.

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
