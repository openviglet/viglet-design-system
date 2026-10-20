# Improvements

## Block A — The gate the design system never had

### §VDS121 The consumer whose declaration has to wait for its bump

VDS77 made `react-hook-form` a required peer, and six of the seven consumers declare it:
shio `^7.87.0`, turing `^7.82.0`, dumont `^7.86.0`, and cloud-frontend, cloud-console
and `@rk/ui` declared during that work. Schools is the one left.

Nothing is broken today, because schools pins `@viglet/viglet-design-system` to an exact
`2026.3.9` rather than a range, the newest release published. It never sees the peer
until somebody bumps it, and pnpm would then auto-install the missing peer rather than
fail — which is the same arrangement working by coincidence that VDS77 existed to
remove.

It was deliberately not declared during VDS77, and the reason is worth carrying. Schools
is adopting a check of its own — `src/dependencies.test.ts` — that fails any dependency
no file imports and that carries no documented reason, and it cross-checks each
documented peer against the *installed* manifest. Schools imports no form, so declaring
`react-hook-form` against the 2026.3.3 it installs would be a dependency nothing imports
and whose stated reason the check could not confirm, because that release still calls it
a dependency.

**So the declaration belongs in the same change as the version bump**, not before it.
Bump schools to the release carrying the peer, add `react-hook-form`, and add its entry
to that test's allowlist naming this package as the peer it is provided for — all three
together, so each one is true when it lands.

Until then schools is the consumer that does not declare it, and this line is what says
so rather than leaving it to be rediscovered.

### §VDS163 The tooltip red, and what a recurrence has to say

One full run turned `tooltip.parity.test.tsx` red on "waits for the delay a provider
above it sets", in the same run that reddened the inline-edit focus test. It has passed
in every full run since — eight of nine — and passes alone every time.

VDS162 explained the inline-edit half: a focus assertion with no wait. This half has no
such explanation. Its assertion is a lower bound on elapsed time measured from before
the pointer moves, and load can only make that number larger, so the red was not the
delay being wrong. What is left is the wait around it — `expect.poll` for the bubble, on
a four-second deadline. For that to expire, the tooltip never opened at all, which means
the hover never reached Radix.

A headless page losing focus would explain both files at once: `activeElement` falls
back to the body, and a pointer no longer over the trigger sends no enter. That is a
candidate, not a finding. Nothing measured it.

So this waits for a recurrence with its output kept. What the next one has to say is
which of the two expired — the poll, or the hover before it — and whether the page still
had focus. Raising the deadline before that is guessing at which number was wrong, and
would only make a stalled run take longer to say the same nothing.

### §VDS186 Reading the other bento consumers

The first `pnpm look:census --write` read Shio only: its dev server was the one running
on this machine, on port 5173 against a local backend. Turing, Dumont and roadkeep-gui
sit in `look-allowance.json` as `measured: null` with that reason, so nothing fails when
their look drifts, and every figure in the round is so far a Shio figure.

The work is operational, not new code. Start each consumer's dev server with its
backend, then run `pnpm look:census --url <id>=<start url> --auth <id>=<user:pass>
--write` with that consumer's bento entry as the start. The walk crawls from there and
reads the router, so nothing about the product needs to be declared first. Commit the
allowance it writes. A consumer that renders `<Routes>` below a splat route only shows
its nested patterns once the walk has reached a page under it. If a reading names a
route by a concrete segment rather than `:param`, the probe's route-table walk in
`scripts/look-census.mjs` missed that router. Fix it there before recording, because an
account name in a route would end up in a committed file.

### §VDS195 The story run stalls

On 2026-09-28 `npm test` ran for 35 minutes with no output and was stopped. Two later
runs of the stories project alone each used their whole 1500 s timeout while vitest
measured 34 to 64 s of tests. In each, one file lost its browser (`Browser connection
was closed while running tests`), a different file each time: `login.stories.tsx`, then
`bento-shell.stories.tsx`. The first also had four files that never connected (`Cannot
connect to the server in 60 seconds`). Both files pass alone in under four seconds.

The same evening it did not come back. The stories project passed alone in 40 s, and
again in 22 s with `npm run build` running beside it. The whole of `npm test` passed in
62 s. Both stalled runs had a build or a Storybook build beside them, and another
session was driving Chromium against a Shio dev server at the time, so load is the
suspect, but a build alone did not reproduce it.

So the defect worth fixing is narrower than a slow gate: once a page drops, the run
waits out whatever timeout wraps it instead of failing that file. Pick this up with a
reproduction in hand. Then read where the wall clock goes (`--reporter=verbose`,
timestamped), and check whether `browser.connectTimeout`, a bound on the stories
project's workers, or `teardownTimeout` turns the hang into a failure. The setting
belongs in `vitest.config.ts` beside that project, with the measurement in its comment.

## Block F — What a consuming CMS needs from the package next

### §VDS152 The deprecation ends

BentoActionsMenuItem.id shipped optional, with a warning outside production for an item
that has none, so a product that upgrades is told before it breaks. The deprecation only
means something if it ends: until the field is required, a new action without a name
type-checks, renders and escapes every census that reads data-action-id.

Once one release has carried the warning, make id required on BentoActionsMenuItem,
which BentoEntityShell's extraActions and the data table's row actions already pass
through, and delete warnWithoutId and its test. The change note in the ledger names the
release that warned. Before shipping, run viglet-ds-check-duplicates and a type-check in
each declared consumer's checkout, or read their source, and list any menu still built
without ids, so the breaking release is not the first they hear of it.

### §VDS219 exportToXlsx on its own entry point

VDS211 moved `xlsx` from `dependencies` to `peerDependencies` so each product can
install the fixed release from `cdn.sheetjs.com`. It had to be a required peer, not the
optional one that design asked for: the root entry re-exports `exportToXlsx`, and
`dist/index.es.js` imports `xlsx` at the top. A Vite 8 build fails with "Rolldown failed
to resolve import" when a dependency imports a package that is not installed, whether
the import is static or dynamic and whether anything calls it or not (checked against a
scratch package on this repository's Vite). So Shio, which never exports a sheet, now
has to declare `xlsx`. If it does not, pnpm's peer auto-install brings 0.18.5 back from
npm.

Expected: `exportToXlsx` gets its own entry point, `./xlsx`: an `exports` row in
`package.json`, a build input in `vite.config.ts` and a line in `check-exports`. It is
the only module there that imports `xlsx`. Once nothing reachable from the root imports
it, `peerDependenciesMeta` can mark `xlsx` optional, and `scripts/externals.test.ts`
flips its required-peer assertion.

The root re-export stays until Turing and Dumont import from `./xlsx`. The non-goal
forbids removing console-era exports before both consoles cut over. Until then, the root
keeps the static import and the peer stays required. So this lands in two commits: first
the subpath, then, after both shims (`src/lib/export-xlsx.ts` in each console) point at
it, the root export goes and the peer becomes optional.

## Block E — The assistant every product shares

### §VDS185 The dock rests at the foot of the rail

The authoring contract gives the corner to the shell: the assistant dock is passed as
`dock`, and `BentoBackToTop` stacks above it, so no component pins itself to the
viewport. The ownership is right, but the result is wrong in the one consumer that was
measured. Shio passes its dock through `BentoShell` as the contract asks, and in every
1440 x 900 capture of 2026-09-28 the orb still sits over page content. It covers the
last row action in the trash, a delete button in the post-type table, a revert button in
the review queue, a tile's corner and the editor's preview. The shell owns the corner
but reserves nothing in it, so the column runs underneath. There are two ways out. One
reserves a gutter the height of the dock at the foot of the column on every page, which
costs space on every screen to protect one element. The other moves the dock's resting
place to a slot the shell already reserves, the foot of the rail, where the orb and its
count sit above the user menu. It opens as a popover anchored to the rail, and on a
phone, where there is no rail, it moves to the header's trailing edge. The second is the
proposal, because the rail foot is empty today and costs nothing. The census's overlap
measure is what shows it done in every consumer that mounts a dock.

## Block C — One look across products

### §VDS201 Package buttons off the control scale

The package half landed: BentoCalendar's previous, next, Today and view buttons and the
entity shell's status pill sit on --vg-control-dense, and the buttons that are text a
reader clicks (BentoInlineEdit's value, BentoDataTable's sort header, BentoDiff's folds,
a calendar entry) carry data-look="text", which look-census-probe.mjs leaves out of the
button-height figure. Measured in Chromium, those explain the 24 px (sort header) and
the 21, 33 and 37 px (the entity hero's inline-edit description and title) readings. The
16, 18 and 29 px readings are still unnamed: the status pill measured 25 px, not 18, and
the calendar header measured 24 to 30 px. What is left needs Shio's dev server and an
account: run look:census --json against it, name the component behind each of those
three values, put it on a control token or mark it as text, add it to
control-height.parity.test.tsx, and lower Shio's button-height allowance with --write,
which also drops the cards VDS202 now skips and the second mono VDS203 now reads as one
face.

### §VDS208 Remove the headerAction alias

VDS205 gave BentoListPage a toolbar prop that a table draws in its own bar, beside
Columns, and kept headerAction as a deprecated alias drawn in the same place so
consumers could move without a flag day. The alias was promised for one release. Once
Turing, Shio and Dumont pass toolbar instead (grep each for headerAction on its bento
list pages), delete headerAction from BentoListPageProps and the `ownToolbar ??
headerAction` fallback in bento-list-page.tsx, drop the test that draws it, and say in
the README's BentoListPage paragraph that it is gone. Do not remove it while any
consumer still passes it: its content would silently stop rendering, since an unknown
prop does not fail a build that spreads props.

## Block H — Product sites on the package

### §VDS217 Counting product sites

The eight React product sites import the package, so `viglet-ds-consumer-entries` can
measure them once they are listed. They need a `chrome` value, since a single-product
landing is not `marketing-site`. The three plain pages take it with `<link
href=".../@viglet/viglet-design-system@<version>/dist/site.css">`, which is not an
import, so the census would count them as taking nothing.

The change has three parts:

- `chrome` gains `product-site`. The alegauss hub joins as `marketing-site`.
- The census also reads `<link>` and `@import` URLs naming this package in `.html` files
  under a consumer's roots, maps each to its entry and records the pinned version.
- The hub and all eleven product sites join `consumers.json`, with tone and accent.

Done when every alegauss site appears with its entries counted from source or HTML, and
removing the package from any one of them fails the census.

### §VDS220 A product site on the site layer

VDS214 shipped `./site` and `./site.css`, and VDS215 shipped the build steps in `./vite`
(`prerenderSite`, `ogCardSvg`, `renderOgCard`). Both are tested inside the package only:
a server render in a node environment, and a prerender into a temporary directory. No
product site uses either yet.

Expected: one of the eight sites (claude-tray is the closest to the template) takes the
release that carries them. It deletes its `Nav`, `Hero`, `Footer`, `FeatureIndex`,
`ThemeToggle`, `CopyButton`, `Rich`, `lib/theme.ts`, `scripts/prerender.mjs` and
`scripts/og-image.mjs`, renders from `./site` with `data-tone="warm"` on `<html>` and
`class="vg-site"` on `<body>`, and builds through the helpers. Diff the text of each
route's output before and after, and the manifest, sitemap and robots byte for byte.

Differences to expect, all by design:

- Radii follow the closed scale, so the 18 px cards become 10 px.
- Every label is a required prop, because the i18n literal gate forbids English
  defaults.
- Sponsor marks carry an empty `alt`, since each sits beside its name.
- The pre-paint script states the OS preference, since the preset has no dark media
  query.
- A site whose card is a hand-drawn template (freewilly, polyweave) may keep it and
  use `renderOgCard` alone.

Left in the sites: the house `Ad` slot, `NonGoals`, `RawSvg`, the Markdown converter
(passed to `prerenderSite` as `twin`) and each product's decoration, which `SiteHero`
and `SiteFooter` take as children.
