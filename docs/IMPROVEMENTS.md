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

### §VDS60 A provider that models only the happy path

`refreshUser` is `fetchUser().then(setUser)`. There is no `.catch`, and `fetchUser` is a
required prop whose whole job is a network call — so rejecting is an ordinary outcome,
not an exotic one. A probe rejecting it gets `unhandledRejection: Error: 401` and a
rendered user of `{}`.

Those are one defect, not two. The rejection has nowhere to go because the context value
has no room for a failure: it is `{ user, refreshUser }`, and `user` is
`useState<VigUser>({} as VigUser)`. A bare `.catch` would only move the silence — the
provider would still hand every consumer an object that satisfies `VigUser` and contains
nothing.

That cast is the second half. A consumer reading `user.name` gets `undefined` while the
type promises a string, and it cannot distinguish "still loading" from "the session
expired" from "a user with no name". Three products render chrome off this — an avatar,
a name, a role gate — and each has to invent its own guess at which of the three it is
looking at, from the same empty object.

`refreshUser` returns `void`, so a caller cannot await a retry or learn that it failed
either.

The fix is a state a consumer can read, and it has to be additive: three consoles are on
this provider, and the non-goal about console-era exports says what removing something
under them costs. Adding to the context value breaks nobody; changing what `user` means
would.

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
