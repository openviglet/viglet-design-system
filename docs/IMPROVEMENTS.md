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

### §VDS51 The strings a component asks for are the package's to ship

Nine of the twenty are the whole icon picker - `forms.iconPicker.chooseAnIcon`,
`searchIcons`, `aiSuggest`, `searching`, `noIconsFound`, `done` and the rest. The others
are `forms.formActions.*`, `common.active|idle` with their tooltips, `common.docs`,
`common.apps` and two `nav.*` entries. Each is called with an English `defaultValue`, so
nothing crashes and nothing shows a raw key: a Portuguese product simply renders
English, which is the quiet failure this block keeps meeting.

`bento-i18n.test.tsx` checks exactly this and is scoped to `bento.*` on purpose - those
are the strings that layer owns - so the console-era and shared UI components have never
been asked. The scoping was right and the gap is that nothing else took the other half.

Ship the twenty in both locales and widen the check to every namespace under
`src/i18n/locales`, keeping the rule that a key outside them is the consumer's to
provide: `llm.title` and `home.title` are asked for too and are correctly absent.

Worth measuring while there: fifty-one shipped keys are asked for nowhere in this
package. Some are a consumer's to use; some are likely dead.

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
