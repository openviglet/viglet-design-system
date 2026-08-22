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

### §VDS41 The fonts are the stylesheet

`dist/viglet-design-system.css` is 964 KB, and 741 KB of it is 22 `url(data:...)` font
files - the Inter and Plus Jakarta Sans variable faces the preset imports. Base64 of an
already-compressed woff2 does not compress again, which is why the stylesheet gzips to
594 KB where a stylesheet of 2,276 rules would gzip to a few tens of kilobytes.

The cost is not only the bytes. Inlined into the CSS the faces cannot be cached apart
from it, so every change to any rule re-downloads every font; they cannot be preloaded
ahead of the stylesheet that carries them; and a product that already serves Inter has
no way to drop this copy.

Emit the faces as files, or move the `@fontsource` imports out of the shipped stylesheet
and into something a consumer opts into - the preset already separates tokens from
rules, and fonts are closer to tokens. Whichever way, `--vg-font-*` should keep working
for a consumer that supplies its own faces.

### §VDS42 Weigh it where it is built

`pnpm run build` ends with `check-dist`, which refuses a `dist` that cannot be
published. `check:size` is not in that chain - it runs as its own CI step - so a local
build that doubles an entry point finishes green and the number is first seen by a
reviewer.

The reason it is separate is real: the two fixtures take about a minute, which is too
long to sit inside every `build` during development. So the answer is probably not to
fold it in but to make it cheap enough to fold in - one fixture rather than two when
nothing under `src/bento` changed, or a fast path that reads `dist` directly and falls
back to bundling only when the content check needs a module graph.

Worth doing after VDS40 and VDS41, whose fixes will move the baseline by megabytes and
say more about which measurement is worth taking on every build.

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
