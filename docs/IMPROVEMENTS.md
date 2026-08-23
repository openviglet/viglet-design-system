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

### §VDS61 The last response wins, not the latest

`searchIcons` writes whatever it gets: `setResults(await searchIconify(q, 60))`. Nothing
records which query that response belongs to, so of two searches in flight the one that
arrives last wins — whichever was asked for first.

The 350ms debounce reads like the guard against this and is not. It delays *starting* a
request; once started, a request is in flight for as long as the network takes, and the
next keystroke after the debounce window starts a second one alongside it. Iconify is a
third-party API over the open internet, so responses arriving out of order is ordinary
rather than exotic.

A probe holds both requests open and releases them newest-first: the grid ends up
showing `archive` for a box reading `arrow`, with the newer results discarded. That is
the exact failure, and it is invisible in every fast-network test.

The same shape was just closed one layer over in `UserProvider` (VDS60), where
`refreshUser` is public and two calls could overlap. A request number decided it there:
increment on the way out, compare on the way back, drop anything that is not the current
one. Nothing about that is specific to a user.

Worth doing together with it: the effect clears its pending timeout on unmount but
nothing stands between an in-flight response and a `setResults` on a dialog that has
closed. React no longer warns about that, which is why it reads as fine.

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
