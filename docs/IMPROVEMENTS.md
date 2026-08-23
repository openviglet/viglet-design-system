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

### §VDS59 A promise the component awaits and never catches

`onSave` is documented as "Awaited if a Promise is returned — used to keep the field in
`saving` state while the underlying mutation resolves." `commit` awaits it inside `try {
… } finally { … }`, with no `catch`, and is wired straight to `onBlur={commit}`, where
React discards the promise it returns.

So a rejecting `onSave` leaves the run: the rejection escapes `commit`, nothing is
subscribed to it, and it lands as an `unhandledrejection`. Products route that to error
reporting or to a crash overlay; a test run reports it as an unhandled error that "might
cause false positives".

Awaiting a promise is a claim to handle what it settles to, and half of that is missing.
The `finally` is the tell — written knowing the await could throw, it puts the field
back into display mode either way, so the failure is not merely unreported: it is made
to look like a success.

It went unnoticed because the only caller inside this package cannot trigger it.
`BentoEntityShell.persistField` catches its own mutation and resolves, so the
failure-path tests VDS58 added pass through here without a rejection ever reaching
`commit`. Every other caller is a product's.

What it should do is what VDS58 decided one layer up: a refused edit goes back. The
draft returns to `value`, the field is not silently left looking saved, and the
rejection is either handled here or handed on deliberately rather than dropped — which
is a decision to make, not a default to inherit.
