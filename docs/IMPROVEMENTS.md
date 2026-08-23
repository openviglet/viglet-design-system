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

## Block C — One look across products

### §VDS73 Counting the consumers that are not SPAs

`consumers.json` exists because a claim checked against a subset is a claim nobody
checked, and its own note says the membership is what the guards read. The membership is
three Vite SPAs. Two Next installs — the cloud console, and the schools admissions front
door — appear nowhere in it, which is the same defect one framework wider.

What the omission costs is specific. The render-parity digest carries one accent per
consumer and so carries none for a server-rendered page. The prose guard cannot fail a
paragraph that says "all three consumers" while five install the package. And
`use:local` discovers consumers by walking a products root on the current line, so a
checkout outside that tree is unreachable by the loop this package offers instead of a
publish.

Adding the entries is the small half. The larger half is that a Next consumer takes a
different set of entry points: no `./router`, because react-router-dom is what the App
Router replaces, and no `./vite`. A guard that assumes every consumer resolves
`./router` is asserting something two of five cannot do, and `chrome: "console"` does
not describe a public front door either — so the entry needs a value that says which
chrome and which framework, not just which package.

Nothing here asks for a fourth and fifth product to be supported differently. It asks
for them to be counted, so that the next one-look claim is checked against what actually
installs this package.

## Block D — The package in a server-rendered framework

### §VDS71 The directive the Vite consumers never needed

Measured, not inferred: `dist/index.es.js` contains zero `use client` directives.
Nothing was wrong for the three declared consumers — Vite serves the whole tree as
client code, so the directive would have been noise. It stops being noise the moment a
consumer compiles with React Server Components, where a module without it is a server
module: the App Router then fails the build on the first hook it reaches.

Two Next consumers already exist. cloud-console pays for it by gating its whole tree
behind an effect, which ships a spinner as its server-rendered HTML; japode/schools pays
for it with a re-export module carrying the directive for the package. Both are the same
workaround written twice, in repositories that cannot fix it.

The directive belongs on the build output here, because only this build knows which
modules are interactive. The cheap version is a banner on every emitted chunk, which is
honest for a library that is interactive throughout and costs a server consumer nothing
it was not already paying. The precise version marks only the entry points that touch
hooks, context or Radix, and leaves the pure helpers and the token exports
server-renderable — worth more to a consumer, and worth deciding rather than assuming.

Whichever lands, the CSS entries and `exports.json` are unaffected: this is about the
JavaScript the framework classifies, not about styles.

### §VDS72 One theme source, and it has to survive SSR

`ThemeProvider` initialises its state with `localStorage.getItem(storageKey)` inside the
`useState` callback. That callback runs during render, so on any server render there is
no `localStorage` and it throws — which is why cloud-console renders a spinner until an
effect says the client is ready, and why japode/schools does not use this provider at
all.

The package already depends on the answer. Its own `Toaster` calls `useTheme` from
next-themes, and `next-themes` is a declared peer dependency, so a consumer that mounts
`ThemeProvider` and a Toaster is running two theme sources that agree only by luck: this
one writes a class from its own storage key, next-themes writes one from `theme`.

So the fix is a convergence rather than a patch. Either this provider becomes a thin
wrapper over next-themes — same props, same storage key, one source of truth, SSR-safe
because next-themes already is — or it reads storage in an effect and seeds from
`defaultTheme`, which fixes the throw but leaves the two sources. The wrapper is the
smaller surface and the one the Toaster already assumes.

Either way `useTheme` keeps its current shape, because three consoles import it. A
consumer that mounts nothing and lets next-themes own the class must keep working too —
that is what schools does today.
