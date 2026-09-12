# Improvements

## Block A — The gate the design system never had

### §VDS107 The entity name that runs as script

`BadgeColorful` renders its `text` prop through `dangerouslySetInnerHTML` and, three
lines later, interpolates the same string into a `<style>` element as `.dark
[title="${text}"]`. Neither path escapes anything, and there is no sanitiser anywhere in
the package.

The prop is not decorative. `components/router/dialog.delete.tsx` passes `usage.name` —
an entity name out of the consumer's own content — into it, so every product's delete
dialog renders a string it did not author as live markup. A name carrying an `onerror`
attribute executes; a name carrying a quote or a closing style tag escapes the attribute
selector and writes arbitrary rules into the host page.

This is the only `dangerouslySetInnerHTML` in the package, it carries no
`eslint-disable` and no comment explaining itself, and the component has no test file at
all. The per-instance colour the `<style>` element is reaching for is what a CSS custom
property on the element is for.

Acceptance:
- `text` is rendered as a text child, escaped by React like every other string.
- No `<style>` element is built from a prop value.
- A test renders a name containing a tag, a quote and a closing style tag, and asserts each appears as text.

### §VDS108 The props that vanish below the breakpoint

`Sidebar` has two branches. The desktop one spreads `{...props}` onto the
`sidebar-container` div, so an `id`, a `data-testid`, an `aria-label` or a handler
reaches the DOM. The mobile one spreads the same `props` onto `Sheet` — a re-export of
Radix's `Dialog.Root`, which renders no element of its own and drops what it does not
recognise. `className` goes the same way: `SheetContent`'s class list is a hardcoded
literal.

So every attribute a consumer sets on `<Sidebar>` works until the viewport crosses the
md breakpoint, and then silently does not. That is the hardest variant to notice, and
the one an end-to-end test is most likely to be driving.

There is no `sidebar.test.tsx` — only a story — so nothing covers either branch today,
which is why the two were free to diverge.

Acceptance:
- The mobile branch forwards rest props and `className` to `SheetContent`, not to `Sheet`.
- A test renders a `Sidebar` with an `id`, a `data-testid` and a `className` on the mobile branch and finds all three in the DOM.
- The same assertions run against the desktop branch, so the two cannot drift again.

### §VDS109 The brand the bundle gate cannot see

`bento-shortcuts-dialog.tsx` asks i18next for `bento.shortcuts.description` with the
inline default "Move around Turing without leaving the keyboard." The shipped English
bundle for the same key was de-branded and reads "Move around without leaving the
keyboard." The two have drifted, and the source string is the one that wins for exactly
the audience it exists for: a host that has not registered the bento bundle.

VDS73 widened the i18n gate to catch a shared string naming a product, but that gate
reads `vigDesignSystemTranslations` — the compiled locale JSON — and never opens a
source file. An inline `defaultValue` is therefore outside it by construction.

A sweep of `src/` finds this is the only `defaultValue` naming a product today, which is
what makes now the cheap moment to close the hole rather than only the string.

Acceptance:
- The inline default matches the English bundle and names no product.
- The i18n gate reads inline `defaultValue` strings in `src/` as well as the compiled bundles.
- Adding a product name to a `defaultValue` fails the suite.

### §VDS110 Two assertions against an optional field

`BentoNavSection` declares both `icon` and `labelKey` optional, and the type's own doc
comment says a section with no label "renders unlabelled". `bento-nav-rail.tsx` builds
its hub links from a list filtered on `areaRoute` alone, then reads
`icon={group.section.icon!}` and `label={t(group.section.labelKey!)}`.

The non-null assertions are what stop the compiler from reporting the mismatch. A hub
section supplied without an icon throws on render; one without a label key feeds
`t(undefined)` into the `aria-label` of an icon-only navigation link, which is the one
control with nothing else to name it.

Both fields are consumer-supplied — the package exports the schema and the product
supplies the array, which is what the non-goals require — so neither case is reachable
from a story, and both fixtures in `bento-shell.test.tsx` set every field.

Acceptance:
- Neither field is read through a non-null assertion.
- A section without an icon is either filtered out of the rail or given a documented fallback.
- A section without a label key still produces a named link, asserted by a test on the accessible name.

### §VDS111 The class the chrome switch swallows

`AdaptiveSectionCard` exists so a shared form does not have to know which chrome is
rendering it. It destructures `className` and forwards it on the `SectionCard` branch
only; the bento branch builds a `BentoFormSection`, whose props interface declares no
`className` at all, so that class list is fixed.

The result is that a form styled through the wrapper keeps its styling in a console and
loses it the moment the same component renders under bento — the single difference the
wrapper was written to hide. Nothing warns: `defaultOpen` is explicitly documented as
"Console chrome only", but `className` carries no such note, so a caller has every
reason to expect it to survive the switch.

This sits inside the migration the non-goals protect. Shio renders both chromes for the
length of that migration, so a shared form being styled identically under each is the
property that makes the parallel route reviewable.

Acceptance:
- `BentoFormSection` accepts `className` and merges it.
- The bento branch of `AdaptiveSectionCard` forwards `className`.
- A test renders the same node under both chromes and asserts the class survives each.

### §VDS112 What the barrel forgot to re-export

Six names are exported from their component files, used in the catalogue, and reachable
from no published subpath. `popover.tsx` exports `PopoverHeader`, `PopoverTitle` and
`PopoverDescription`, all three demonstrated in `popover.stories.tsx`; `sidebar.tsx`
exports `useSidebarOptional`, whose doc comment says it exists so a Module Federation
remote can probe for a provider without throwing; `section-card.tsx` exports
`colorVariants` and `ColorVariant`. `components/ui/index.ts` re-exports the component
neighbours of each and stops short of these.

`components/index.ts` is `export * from "./ui"`, so the root barrel inherits the same
gap, and none of the six appear in `dist/exports.json`.

A product therefore sees a story it cannot reproduce, and the one hook written for a
multi-remote host — the shape two consumers actually deploy — has to be reimplemented at
the call site, which is the local copy the non-goals rule out.

Acceptance:
- All six names are re-exported and appear in `dist/exports.json`.
- A gate reports any name exported from a component file that no subpath re-exports.
- That gate runs in `pnpm test`, not only on a release.

### §VDS113 The class list that is built by hand

`BadgeLocale` builds its class list by splicing `className` into a template literal with
no fallback. The prop is optional and the package's own `LanguageSelect` omits it, so
the rendered element carries a literal `undefined` class — shipped, in every product,
today.

The wider defect is the template literal itself. `cn()` exists here to run
tailwind-merge, which is what makes a consumer's `py-2` beat the component's `py-1`
rather than merely following it into the class attribute and losing to stylesheet order.

Two bento components splice the same way: `bento-status-marker.tsx` guards with `?? ""`
and `bento-inline-edit.tsx` behind a default parameter, so neither can emit `undefined`,
but neither merges either — and `bento-inline-edit` documents its `className` as the
prop that keeps the display and edit states visually identical, which is precisely the
case a non-merged override fails.

Acceptance:
- All three sites merge through `cn()`.
- No rendered element carries a literal `undefined` class, asserted by a test.
- A gate reports a class list built from a prop by template literal.

### §VDS114 The prop the stylesheet ignores

`GlassCard` accepts `color` and `colorDark` and writes them to `--glass-card-color` and
`--glass-card-color-dark` as inline custom properties. `glass-card.css` has two rules.
The light one reads `--ff-color-rgb`, inherited from an ancestor `FloatingFormulasBg`.
The dark one hardcodes a flat black. Neither reads either property the component sets,
and a comment in the stylesheet names a third spelling, `--glass-card-color-rgb`, that
nothing sets or reads either.

So both props are inert. The `WithAccentColor` story is pixel-identical to `Default`,
and the dark shadow can never be tinted by anything at all.

The props carry doc comments promising a tint the stylesheet has no way to produce,
which is worse than their absence: a product author reads the prop, passes a brand
colour, sees no change, and has nothing to debug. There is no unit or parity test for
this component.

Acceptance:
- The stylesheet reads the properties the component sets, in both schemes — or the props and their doc comments are removed.
- One spelling of the custom property exists.
- A test asserts `WithAccentColor` renders differently from `Default`.

### §VDS115 The search nobody cancels

VDS61 gave the icon picker a monotonic request id so a slow response cannot overwrite a
newer one. That guard compares ids; it says nothing about the component no longer being
there.

The effect driving the search clears its debounce timer on cleanup and nothing else.
`searchIconify` takes no signal and passes none to `fetch`. The suggest path has no
guard at all. So a route change mid-search leaves a request to `api.iconify.design`
running to completion with its result discarded.

Under React 19 the late `setState` calls are no-ops rather than warnings, which is why
the suite is quiet about it — the cost is the uncancelled network call and the work
behind it, on every dialog a user opens and leaves. The nearest existing comment reasons
about the dialog *closing*, which unmounts the content and not this component, so it
does not cover the host unmounting the picker.

Acceptance:
- Both the search and the suggest fetch take an `AbortController` signal.
- The effect aborts the in-flight request on cleanup, not only the debounce timer.
- A test unmounts mid-request and asserts the request was aborted.

### §VDS116 The components the catalogue never shows

VDS6 wired the axe addon so every story is checked for accessibility. Cross-referencing
`dist/exports.json` against the 68 story files shows 40 exported components named in no
story.

Most of the 40 are compound sub-parts a parent story already renders — a
`SidebarMenuSubItem` is exercised by the sidebar story whether or not it has one of its
own, and giving each a story would buy coverage the suite already has. Eight are
standalone components a product would import directly and nothing renders anywhere:
`IconPickerDialog`, `BentoPanel`, `BlankSlate`, `GridList`, `DialogDelete`,
`PageHeader`, `SubPage` and `InternalSidebar`.

Each of those eight is outside the only accessibility gate the suite runs, and absent
from the catalogue that exists so a product author finds a component instead of
rebuilding it — which is what `BentoPanel`'s own doc comment says it was written to
stop.

Acceptance:
- The eight standalone components each have a story rendering their default shape.
- The axe pass covers them.
- A gate reports a newly exported standalone component that no story renders.

### §VDS117 The i18n runtime on the root entry

`src/index.ts` re-exports the `./i18n` subpath's runtime — `registerVigTranslations`,
`vigDesignSystemTranslations` and `initVigI18n`. Walking the built ESM graph from
`dist/index.es.js` reaches the locale chunk, about 13.9 KB of bundled translations, and
through it three bare imports: `i18next`, `i18next-browser-languagedetector` and
`react-i18next`, none of them marked optional in `peerDependenciesMeta`.

Three of the seven consumers — Shio, Schools and the Roadkeep GUI — take `.` and no
`./i18n`. Each must therefore resolve two peer packages it never asked for and carry
locale data it never reads. The README documents only the subpath form, so nothing tells
a consumer that the root entry offers this at all.

`check:size` measures a root-only fixture as a worst case and asserts bento evidence,
font-face count, subpath CSS leakage and inline asset size. Nothing asserts the root
entry is free of i18n, which is why this has been true without anyone noticing.

Acceptance:
- The root entry does not re-export the i18n runtime; `./i18n` remains the way in.
- `check:size` asserts the root-only fixture reaches no locale bundle and no i18next import.
- The three root-only consumers still build.

### §VDS118 The entry the size gate skips

VDS40 found the root entry was 96% four inlined PNG logos, one of them 1.27 MB, and part
of the answer was `MAX_INLINE_ASSET` — a 256 KB cap in `check-size.mjs`.

That cap is evaluated inside `assess()`, which runs once per entry in `FIXTURES`.
`FIXTURES` holds `root-only`, `bento` and `fonts`. None of them imports `./assets`, and
`size-budget.json` records no baseline for it. So the one published entry that actually
ships the artwork is the one entry the artwork check never sees.

Nothing is over the cap today, and the bite is narrower than it looks: `logos.test.ts`
caps every PNG in `src/assets/products` at 96 KB and 256 px on arrival, which is
strictly tighter than 256 KB for those four files. What is missing is the baseline —
`./assets` is the only published entry with neither a recorded size nor an inline-asset
check, so growth there is unmeasured rather than merely uncapped.

Acceptance:
- `FIXTURES` includes an `assets` entry and `size-budget.json` records its baseline.
- `MAX_INLINE_ASSET` is evaluated against that entry.
- Adding an oversized asset reachable from `./assets` fails `check:size`.

### §VDS119 The catalogue no compiler reads

`tsconfig.app.json` excludes `src/**/*.stories.ts` and `.tsx`. `tsconfig.node.json`
covers the Vite and Vitest configs and `scripts/`. The root `tsconfig.json` references
those two. `.storybook/tsconfig.json` exists but no script mentions it.
`eslint.config.js` sets no `parserOptions.project`, so the lint is not type-aware
either. The stories project runs the files through Vite, which strips types rather than
checking them.

So no gate in this repository type-checks the catalogue, and the result is measurable
rather than theoretical: `tsc -p .storybook/tsconfig.json --noEmit` reports 49 errors
across 12 story files — a `direction` prop that does not exist on `resizable`, and more
of the same in `section-card`, `stepper`, `toggle-group`, `drawer`, `form`,
`form-actions`, `error-boundary` and four bento stories — while `pnpm run typecheck` is
green.

The catalogue is this package's own first consumer, and it is the one consumer the
compiler never reads.

Acceptance:
- A tsc project type-checks the stories and `pnpm run typecheck` includes it.
- The existing errors are fixed, so the gate starts green.
- A story passing a prop a component does not declare fails that gate.

### §VDS120 Two lists free to disagree, again

VDS43 moved `PEER_EXTERNALS` and `EXACT_EXTERNALS` into `scripts/lib/externals.mjs`
because `vite.config.ts` and `check-size.mjs` had disagreed about what a consumer
supplies. The comment above the import still says so, in the past tense: shared so the
two cannot disagree — they did.

The same shape survives one file over. `CLIENT_ENTRIES` — which entries get the `"use
client"` banner — is a hand-maintained `Set` in `vite.config.ts` and an independent
literal in `check-dist.mjs`, beside `SERVER_ENTRIES`; `ROUTER_ENTRIES` in the same file
is a third. The check iterates its own sets rather than `build.lib.entry` or `dist`
itself.

So an eighth entry added to the build alone ships with no banner, and the loop never
looks at it — VDS71's gate passing on precisely the kind of file it was written to
catch, with the failure landing in a Next consumer's build instead.

Acceptance:
- The entry classification lives in one module that both files import.
- `check-dist` derives what to inspect from `build.lib.entry` or `dist`, not from a literal.
- A new entry missing its banner fails the gate.

### §VDS121 The consumer whose declaration has to wait for its bump

VDS77 made `react-hook-form` a required peer, and six of the seven consumers declare it:
shio `^7.87.0`, turing `^7.82.0`, dumont `^7.86.0`, and cloud-frontend, cloud-console
and `@rk/ui` declared during that work. Schools is the one left.

Nothing is broken today, because schools pins `@viglet/viglet-design-system` to an exact
`2026.3.3` rather than a range. It never sees the peer until somebody bumps it, and pnpm
would then auto-install the missing peer rather than fail — which is the same
arrangement working by coincidence that VDS77 existed to remove.

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

### §VDS122 Two more consumers nobody wrote down

`consumers.json` says of itself that it is the one place the consumer set lives, and
that prose naming a subset as though it were the whole is a test failure rather than a
style note. VDS73 widened it from three to seven for exactly that reason: cloud-frontend
was a Vite SPA nobody had written down, and being outside the products root that
`use:local` walks is what kept it invisible.

Two more are invisible the same way. `openviglet-website` and `viglet-docs` both declare
`@viglet/viglet-design-system` at `^2026.3.2` — a caret range, where every listed
consumer except `@rk/ui` pins exact — so both receive each release the moment they
install, and neither appears in `consumers.json`, in the README's count of applications,
or in any guard that reads the file.

They are not equivalent, and the answer is probably not the same for both. `viglet-docs`
imports one subpath, `./floating-formulas-bg`, for a decorative background.
`openviglet-website` imports nothing from the package at all in its own source, which
either means the dependency is unused or that the import is somewhere this did not look.

What to settle: whether each is a consumer this package holds itself to. If it is, it
belongs in `consumers.json` with its framework, chrome, accent and entries, and the
README's count moves with it. If it is not — a site taking one decorative entry may
genuinely not be — then say so where the next person looks, because the absence
currently reads as an oversight and cannot be told apart from one.
