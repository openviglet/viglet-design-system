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
