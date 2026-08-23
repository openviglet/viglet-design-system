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

### §VDS68 A lint that only reports is not a gate

A component file that also exports its cva variants is this package's pattern, and
consumers import those names, so `react-refresh/only-export-components` is warn-only on
purpose. That decision is sound and is not what this line reopens. What it costs is the
gate: 58 accepted warnings are the number CI prints every run, nobody reads a list that
long, and `eslint .` carries no `--max-warnings`, so a warning of any other kind exits 0
beside them.

That is not hypothetical. Two `eslint-disable no-console` directives are already dead —
one in `src/components/error-boundary.tsx`, one in `src/components/ui/form.stories.tsx`
— and ESLint has been reporting both as unused directives into a floor nobody scans. A
stale suppression is the worst kind of dead code: it reads as a decision, and the day
the line beneath it grows a real `no-console` violation, the directive silences it.

The fix is to make the accepted pattern silent rather than tolerated, so that anything
left is a defect. Turn the rule off for the files where exporting variants beside a
component is the deliberate pattern — the same scoping the config already does for
stories and tests — keep it on everywhere else, delete the two dead directives, and then
run lint as `eslint . --max-warnings 0` in both the script and CI. A count that must
stay at zero is a gate; a count that only has to stay roughly where it was is a habit,
and the habit is what let two directives rot.

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
