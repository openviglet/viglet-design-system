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

### §VDS65 Two forms of a locale, one of them handled

`getFlagEmoji` reads the region as `locale.split("_")[1]`. That is the Java and POSIX
spelling, `pt_BR`. It is not the one anything in a browser produces:
`navigator.language`, `Intl`, i18next and BCP 47 all say `pt-BR`, and this package's own
`i18n.language` is hyphenated. Given one, the region is `undefined` and the caller
silently gets 🌐 — measured: `pt_BR` → 🇧🇷, `pt-BR` → 🌐, `en-us` → 🌐.

The package already knows better. `getLocaleCountryCode`, in `badge-locale.tsx`, opens
with `locale.trim().replaceAll("-", "_").toUpperCase()` and handles both, with a
language-code fallback underneath. So there are two answers to one question in one
package, the wrong one is the one on the public barrel, and a consumer reaching for the
obvious name gets it.

`truncateMiddle` in the same file has a smaller version of the same shape: it promises a
string no longer than `maxLength` and returns `"..."` — three characters — for
`maxLength` of 2, 1 or 0. The arithmetic goes negative and `substring` quietly clamps,
so nothing complains.

Neither is caught because `src/lib/utils.ts` has no tests at all, and it is four
exported functions on the root barrel: `cn`, `truncateMiddle`, `getFlagEmoji`,
`getHashedColor`.

The fix worth making is not two patches. It is one normalisation both callers share, so
the next locale format lands in one place rather than two.

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
