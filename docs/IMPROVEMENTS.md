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

### §VDS52 useGridAdapter memoizes on half its inputs

`useGridAdapter(data, config)` is an exported hook: a product hands it rows and a
`config` of extractors — `name`, `description`, `url`, `icon`, `id` — and gets
`VigGridItem[]` back. The memo reads all of them and depends on `[data]` alone.

So the hook is correct only while `config` never changes. It does. A `url` builder
closes over a route param; a `description` extractor closes over the active locale. When
one changes and the rows do not, the memo returns the previous array: links to the old
route, descriptions in the old language. Nothing warns at runtime, which is what makes
it hard to trace back to a hook two layers away.

`react-hooks/exhaustive-deps` flags it. It is a warning, and `npm run lint` exits 0 on
warnings, so the gate reports green over a known-wrong dependency array. VDS28 promoted
the compiler-era rules to errors and left this one alone; the file is the evidence that
the remaining warning was not the harmless half.

The reason it was left is real, and it is why this is a task and not a one-line fix.
Adding `config` to the array is wrong in the common case: every call site writes an
inline literal, so `config` is a fresh reference each render and the memo stops
memoizing — trading correctness for the recomputation the hook exists to avoid.

Done right, the hook depends on the extractors rather than on the object holding them,
and the gate that let this through stops exiting 0 over it.

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
