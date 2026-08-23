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

### §VDS58 An optimistic write with no way back

`persistField` writes the patch into `staged` first, then awaits `onUpdate`:

```
setStaged((prev) => ({ ...prev, ...patch }));
try   { await onUpdate(...); toast.success(...) }
catch { toast.error(...) }
```

The optimistic write is right. What is missing is the other half of it — on the error
path nothing puts `staged` back.

Nothing else does it either, and that is worth following, because the component does
have a path that resyncs from props. It compares the four identity fields against the
`entity` prop during render and re-stages when they differ. But `identity` is *derived*
from `entity`, and a save that failed is a save that changed nothing, so `entity` is
untouched, `identity` is untouched, and the comparison finds nothing to correct. The one
mechanism that could recover is inert in exactly the case that needs it.

What a user gets: a toast reading "not updated", above a field showing the value they
typed. Reload and the edit is gone. Worse, the component now disagrees with the entity
it renders — the next `persistField` builds its patch from `{ ...entity, ...patch }`,
off the untouched prop, so the failed edit is neither retried nor included, while the
screen still shows it.

Nothing catches it because nothing exercises the path: no test drives `onUpdate` into a
rejection, which is also why VDS55 could not use these two `console.error` calls as its
example.
