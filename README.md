# Viglet Design System

Shared component library, design tokens, hooks, utilities, and i18n for the
seven applications that install it: the Turing, Dumont and Shio consoles,
the Cloud Console, the Cloud Home, Schools, and the Roadkeep GUI.
`consumers.json` is the list, and it is what the guards read.

**[Browse the component catalogue](https://openviglet.github.io/viglet-design-system/)** — every
component, its variants and its props, rebuilt on each commit to `2026.3`. Look
there before writing a component: the catalogue is the answer to "does this
already exist".

The six applications that install this package are the consumers it holds itself
to, declared in [`consumers.json`](consumers.json) rather than remembered: each
entry names its framework, its chrome, the accent it renders with and the
subpaths it takes, and CI refuses prose that names a subset as though it were
the whole set. An eighth is one entry there, and the checks widen with it.

Three are Vite consoles (Turing, Shio, Dumont), one is a Vite platform home
(the Cloud Home), one is a Vite desktop shell (the Roadkeep GUI), and two are
Next applications (the Cloud Console and Schools). The split matters: a Next
consumer takes no `./router` and no `./vite`.

## Installation

```bash
pnpm add @viglet/viglet-design-system
```

**Declare `react-hook-form` yourself.** It is a required peer, not something this
package brings: the root entry exports `Form`, and that module re-exports
`FormProvider`, `useFormContext` and `useFormState` straight from it. A second
copy in your tree is a second React context, and `useFormContext` then returns
null inside a form that looks correctly wired. Declaring it is what keeps the
install to one copy — `npm ls react-hook-form` should say `deduped`.

## Trying a change in a product before publishing

A change here is a change to shared chrome, so the question is always what it
does to Shio, Turing, Dumont, the Cloud Console, the Cloud Home, Schools and the
Roadkeep GUI — and the answer should not require a publish. `use:local` walks a
products root, so it reaches the first three; the other four are checked out
elsewhere and `npm pack` into them is the loop until that changes (VDS73). From this checkout:

```bash
pnpm use:local           # build, then push dist into every 2026.3 product on disk
pnpm use:local --list    # show what it would write to, and stop
```

It finds the consumers by reading their `package.json`, and finds where each one
keeps the installed copy by following the link its own package manager made, so
neither a version bump nor a switch of package manager breaks the loop. Nothing
in the product's manifest or lockfile changes: `pnpm install` in the product puts
the published build back.

Pass directories to narrow it, and `--no-build` to reuse the `dist` already on
disk:

```bash
pnpm use:local ../shio/2026.3/shio-react --no-build
```

One thing it refuses to do: push over a tree whose dependencies are behind. It
writes files, and files cannot re-resolve a dependency — so if a range moved
here since the product last installed, the manifest it copies would ask for a
version the directory beside it does not have, and the product would fail to
build on symbols that version does not export. It names those packages and
stops. That is a real limit rather than a check to switch off: a range that
moved reaches a product through a release, not through this. `--skip-dep-check`
pushes anyway when you know why you want it.

## Catching a duplicate before it drifts

The package ships `dist/exports.json` — every name it exports, per entry point —
and a CLI that reads it. Run it in the product's own CI:

```bash
viglet-ds-check-duplicates src
```

It fails, naming the import that replaces each local copy:

```
src/components/page-header.tsx:18  declares PageHeader
    replace it with:  import { PageHeader } from "@viglet/viglet-design-system/router"
```

One-line re-export shims are the sanctioned pattern and are skipped. When a
collision is deliberate — a product component that renders that product's own
data and merely shares a name — keep it by writing the reason in the file:

```ts
// viglet-ds-allow-duplicate AppFooter -- renders Shio's build version
```

In a product's workflow, it is one step beside the lint:

```yaml
      - name: No local copy of a shared component
        run: pnpm exec viglet-ds-check-duplicates src
```

Add `--warn` to report without failing while the existing collisions are being
worked through, and drop it once the count is zero. `--json` prints the findings
for a bot to read; `--manifest <path>` checks against an export list other than
the installed one.

## Setup

### 1. Import styles

In your app's entry CSS (e.g., `index.css`):

```css
@import "@viglet/viglet-design-system/styles";
```

Or in your entry TypeScript/JavaScript:

```ts
import "@viglet/viglet-design-system/styles";
```

The brand faces are a **separate import**, and one you probably want:

```css
@import "@viglet/viglet-design-system/styles";
@import "@viglet/viglet-design-system/fonts";
```

They used to be inside `./styles`, where they were 741 KB of its 964 KB —
Vite's library mode inlines every asset regardless of `assetsInlineLimit`, so
every subset of Inter and Plus Jakarta Sans was base64 in the CSS, twice over
because the preset imported them as well. Base64 of an already-compressed woff2
does not compress again, which is why 2,276 rules gzipped to 594 KB. Splitting
them takes `./styles` to 31 KB gzipped.

`./fonts` is 5 KB of rules pointing at 11 `.woff2` files shipped beside it in
`dist/fonts/`. Nothing in it resolves through your `node_modules`, and your CDN
and browser cache the faces apart from the rules — so a change to any rule no
longer re-downloads every font, and a product already serving Inter can drop
this copy.

**A page fetches about 77 KB of that, not 272 KB.** Each face carries a
`unicode-range`, so the browser asks only for the subsets your text needs; an
English or Portuguese page takes `latin` and nothing else, the accented
characters Portuguese uses being Latin-1 rather than `latin-ext`.
`size-budget.json` records both numbers, and CI fails if either moves — or if
the faces stop being subsetted at all.

**Upgrading:** add the second line, or the type falls back through `--font-sans`
to `system-ui`. That is a real look rather than a broken one, but it is not the
one the catalogue shows.

### 2. Initialize i18n

```ts
import { initVigI18n } from "@viglet/viglet-design-system/i18n";

// With app-specific translations merged in
initVigI18n({
  en: { myApp: { greeting: "Hello" } },
  pt: { myApp: { greeting: "Ola" } },
});
```

Or register into an existing i18n instance:

```ts
import { registerVigTranslations } from "@viglet/viglet-design-system/i18n";
import i18n from "i18next";

registerVigTranslations(i18n);
```

**Both merge key by key, and your key always wins.** Shipping your own `common`
does not cost you the package's — `common.save` stays yours and `common.next`
still resolves to the word this package ships. `registerVigTranslations` never
replaces a key the host already has, so calling it twice is safe.

**`initVigI18n` takes any language, not only the two this package ships.** Pass
`es`, `fr` or anything else and it arrives whole; `en` and `pt` still merge leaf
by leaf with yours. The package's own strings exist in `en` and `pt` only, so
`fallbackLng` stays `en` and a screen asking for a string the package ships
reads English under a third language until you translate it yourself.

This used to merge a namespace at a time: a product with its own `common`
replaced the package's outright, and every string the package asked for under
that namespace fell back to its English default — in a Portuguese product,
silently. If you worked around it by renaming a namespace or copying the
package's keys into yours, you can stop.

**One string lands before any of this.** The boot loader from
`@viglet/viglet-design-system/vite` is HTML written at build time and paints
before a bundle runs, so it cannot ask i18next for anything. Its status region is
named `"Loading <title>"` unless you say otherwise — pass `loadingLabel` for the
phrase in your language, or `loadingLabels` (a language tag to a phrase) for a
product that ships several, which the loader's inline script picks from
`navigator.language`.

### 3. Setup providers

```tsx
import {
  ThemeProvider,
  BreadcrumbProvider,
  UserProvider,
  Toaster,
} from "@viglet/viglet-design-system";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="my-app-theme">
      <BreadcrumbProvider>
        <UserProvider fetchUser={() => api.getCurrentUser()}>
          <Toaster />
          {/* Your routes */}
        </UserProvider>
      </BreadcrumbProvider>
    </ThemeProvider>
  );
}
```

`ThemeProvider` is a thin wrapper over [`next-themes`](https://github.com/pacocoursey/next-themes),
which is a peer dependency. Three consequences worth knowing:

- **It renders on a server.** No `localStorage` is read during render, so a
  server-rendered or React Server Components consumer can mount it.
- **There is one theme source.** This package's `Toaster` reads `next-themes`
  directly, so mounting both used to run two theme systems writing the class
  from two storage keys. It no longer does.
- **You can skip it.** A consumer that mounts `next-themes`'s own provider gets
  the same result, and `useTheme` from here reads that one — useful when a
  framework already sets the theme up for you.

`useTheme()` returns `{ theme, setTheme }`, where `theme` is the *setting*
(`"light" | "dark" | "system"`) rather than the resolved colour.

### React Server Components

The published entries carry a `"use client"` directive where they need one, so a
Next App Router server component can import this package without adding a
directive of its own:

| Entry | |
|---|---|
| `.`, `./bento`, `./router`, `./floating-formulas-bg`, `./i18n` | client — they reach React state, context or a browser API |
| `./assets`, `./vite` | server-renderable — logo data, and a build-time Vite plugin |

`./i18n` is the one worth pointing at: it looks pure, and it pulls
`i18next-browser-languagedetector`. `./assets` staying unmarked is deliberate —
a server component can read a product logo without a client boundary.

**The directive is not the whole story for a Next consumer.** `./router` and
`./bento` import `react-router-dom` (see the peer note further down), which an
App Router application does not use. Being marked client makes them *compile*
under RSC; it does not make them route. Today a Next consumer takes the root
entry, `./assets`, `./floating-formulas-bg` and the styles.

### 4. Setup Axios CSRF protection

```ts
import { setupAxiosInterceptors } from "@viglet/viglet-design-system";

setupAxiosInterceptors({
  baseURL: "/api",
  loginPath: "/login",
});
```

## Usage

### UI Components

```tsx
import {
  Button,
  GradientButton,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Dialog,
  DialogContent,
  DialogTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@viglet/viglet-design-system";
```

### App Components

```tsx
import {
  DialogDelete,
  LoadProvider,
  GradientButtonLink,
  AppFooter,
  LanguageSelect,
  ModeToggle,
} from "@viglet/viglet-design-system";
```

A page's chrome — its header, its list, its sidebar — comes from the
[bento layer](#the-bento-layer) rather than from here. Read the next section
before reaching for `PageHeader`, `GridList` or `InternalSidebar`.

### Two eras, and which one a new page should use

This package exports two complete page vocabularies. The **console era** is what the consoles ship on today; the **[bento layer](#the-bento-layer)** is the current one, and Turing has cut over to it. Every console-era export is marked `@deprecated` in its own types, so an editor strikes it through and offers the swap.

Nothing is being removed. No product has started cutting over, and a removal will get its own roadmap line rather than arriving as a side effect of this notice — so existing pages keep working and need no rush.

| Console era | Use instead | |
|---|---|---|
| `PageHeader` | `BentoHero` | Same title/subtitle/icon, plus a tone — the chip follows the product accent. |
| `SubPageHeader` | `BentoHero` | With `BentoBackLink` for the back target and `BentoActionsMenu` for the menu. |
| `StickyPageHeader` | `useBentoScrollFade` | The scroll state is separated from the chrome, so it also drives `BentoScrollSaveBar`. |
| `GridList` | `BentoListPage` | `BentoTileGrid` is the mosaic alone, for a page with its own chrome. |
| `BlankSlate` | `BentoEmptyState` | |
| `InternalSidebar` | `BentoNavRail` | The rail takes its nav array as a prop instead of importing routes. |
| `NavMain` | `BentoNavRail` | |
| `NavUser` | `BentoUserMenu` | Routes and feature flags arrive as props. |
| `SubPage` | `BentoEntityShell` | Renders through a render prop, so the shell never learns what an entity is. |
| `Page`, `PageContent` | — | No single replacement, deliberately: the shell is where a product is itself. Compose `BentoNavRail`, `BentoUserMenu` and `BentoCommandPalette`. |

`DialogDelete`, `LoadProvider` and `GradientButtonLink` are **not** console-era — the bento layer uses them itself, and they are not deprecated.

### The mascot

`VigletAvatar` is the Viglet mascot: a small sun that shows what the system is
doing. It is one `<canvas>` and no new dependency — the faceted core is drawn
directly, so a product gets the mascot by installing this package and nothing
else.

```tsx
import { VigletAvatar } from "@viglet/viglet-design-system";

<VigletAvatar state="working" size={128} />;
```

The five states are named for the toast kinds, so a product that already reports
through `toast` has nothing to translate:

| `state` | When | What it does |
|---|---|---|
| `idle` | nothing is happening | a slow, low glow |
| `working` | a request is in flight | an orbit with a travelling arc |
| `success` | it finished | a swell, then a pulse outward |
| `error` | it failed | the light goes out — it does not turn red |
| `attention` | something arrived | a ring rises from below |

Four further props shape it rather than drive it: `compact` pulls the camera in
and drops the pool of light, for a collapsed dock; `unread` holds a slow orbit
while an answer waits; `activity` is a counter you bump to make the mascot react
to something smaller than a state change, like a keystroke; and `seed` fixes the
field of rising embers. The same props always draw the same sparks, so a product
that wants a different field per visit passes a changing `seed` itself.

The mascot is decorative (`aria-hidden`) and says nothing a screen reader can
use — give the surface that wraps it the accessible name. It draws one frame and
starts no animation loop for a reader whose system asks for reduced motion, and
`paused` does the same for a product with its own motion switch. When nothing is
happening it stops drawing altogether rather than holding a loop open.

### The assistant dock

`VigletAssistant` is the surface the mascot lives in. Collapsed it is a status
light with the system's last sentence typed beside it; open it is a panel with a
transcript and a composer.

```tsx
import { VigletAssistant } from "@viglet/viglet-design-system";

<VigletAssistant
  state={state}
  caption="/q3-results published at 14:02."
  messages={messages}
  busy={busy}
  onSend={(text) => ask(text)}
/>;
```

**The dock knows no backend.** `messages`, `busy` and `onSend` are the whole
contract — the endpoint, the prompt and the key stay in your product. Leaving
`onSend` off is how you turn the chat off: the composer is not rendered at all
and the dock becomes a place the system reports from, which is what a product
that only wants notification feedback should mount.

A message may carry one `action`, so an answer can offer something to do with
it — the label is your copy, already translated:

```tsx
messages={[{
  role: "assistant",
  text: "Lead with the number.",
  action: { label: "Use this title", onSelect: () => setTitle(suggested) },
}]}
```

It pins itself to the bottom-right of the viewport; pass `inline` to render it
in flow and place it yourself. `open` / `onOpenChange` make it controlled,
Escape collapses it, and the caption is typed for everyone while a screen reader
is handed the whole sentence at once.

Its own words — the state names, the two buttons, the placeholder — come from
the `assistant.*` keys this package ships in `en` and `pt`. See
[Initialize i18n](#2-initialize-i18n); everything else it says is your copy.

#### Letting notifications drive it

You already report outcomes through `toast`. `useAssistantNotifications` reads
the Toaster back, so the mascot moves without a second call beside each one:

```tsx
import {
  Toaster,
  VigletAssistant,
  useAssistantNotifications,
} from "@viglet/viglet-design-system";

function Chrome() {
  const { state, caption, activity } = useAssistantNotifications();

  return (
    <>
      <Toaster />
      <VigletAssistant state={state} caption={caption} activity={activity} />
    </>
  );
}
```

It **wraps nothing**. Call sonner from anywhere in your app — from a module that
has never heard of this hook — and the mascot still moves.

| Toast | State |
|---|---|
| `toast.loading` | `working` |
| `toast.success` | `success` |
| `toast.error` | `error` |
| `toast.warning`, `toast.info` | `attention` |
| nothing on screen | `idle` |

With several up, work in progress outranks an outcome and a failure outranks a
success. `caption` is the toast's own title when it is a string — a toast
rendered as JSX has no sentence to lift, so you get `null` rather than a guess.
The hook is opt-in: pass `state` yourself and nothing here interferes.

### Hooks

```tsx
import {
  useIsMobile,
  useDateLocale,
  useGridAdapter,
  useSubPageBreadcrumb,
  useAssistantNotifications,
  useTheme,
  useBreadcrumb,
  useCurrentUser,
} from "@viglet/viglet-design-system";
```

### Utilities

```tsx
import {
  cn,
  truncateMiddle,
  getHashedColor,
  getFlagEmoji,
  exportToXlsx,
} from "@viglet/viglet-design-system";
```

`exportToXlsx(data, headers, filename, sheetName?)` takes an optional sheet name; without one the sheet is named after `filename` (it used to be `Logging`, whatever you exported). The header row is written from `headers`, so an export with no rows still arrives with its column titles rather than as an empty file.

### Product logos

```tsx
import { productLogos, type ProductId } from "@viglet/viglet-design-system/assets";
```

Their own subpath, not the root barrel. Vite's library mode inlines every asset
regardless of `assetsInlineLimit`, so anything the root barrel could reach was
base64 inside the root entry — `productLogos` names all four logos, and one of
them is 1.24 MB, which put 1.90 MB of PNG in front of every consumer. Nothing
renders that one: `VigletAppSwitcher` draws the Viglet Cloud entry with an icon.
Moving the map here left the root entry 56% lighter, and the size gate now
refuses any single inlined asset over 256 KB.

`VigletAppSwitcher` still imports the three logos it draws, so it needs no
change — and those three are now 256px rather than 1024–2375px, which is nine
times the 28 pixels the switcher renders them at. A test holds that ceiling,
because an asset this package can reach is an asset it ships.

### Models

```tsx
import type {
  VigUser,
  VigLocale,
  VigGridItem,
} from "@viglet/viglet-design-system";
```

## What's Included

### UI Primitives (41 components)

Accordion, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, Drawer, DropdownMenu, Form, FormActions, FormItemTwoColumns, GradientButton, GradientSwitch, HoverCard, Input, Label, NavigationMenu, Pagination, Popover, Progress, Resizable, SectionCard, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner (Toaster), Stepper, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip, VigletAssistant ([the dock](#the-assistant-dock)), VigletAvatar ([the mascot](#the-mascot))

### App Components (23 components)

AppFooter, BadgeColorful, BadgeLocale, DialogDelete, GradientButtonLink, LanguageSelect, LoadProvider, ModeToggle, NavSecondary, ThemeProvider

Console-era, `@deprecated`, still exported — see [the swap table](#two-eras-and-which-one-a-new-page-should-use): BlankSlate, GridList, InternalSidebar, NavMain, NavUser, Page, PageContent, PageHeader, StickyPageHeader, SubPage, SubPageHeader

### Hooks

`useIsMobile`, `useDateLocale`, `useGridAdapter`, `useSubPageBreadcrumb`, `useAssistantNotifications`

`useGridAdapter(data, config)` tracks each extractor in `config`, not the object holding them, so a `url` builder that closes over a route param or a locale re-maps the rows when it changes. Pass the config inline if you like — keep the extractors themselves stable (a field name, a module-level function, a `useCallback`) and the memo holds.

### Contexts

`BreadcrumbProvider` / `useBreadcrumb`, `UserProvider` / `useCurrentUser`, `ThemeProvider` / `useTheme`

`useCurrentUser()` returns `status` (`"loading" | "ready" | "failed"`) and `error` alongside `user` and `refreshUser`. Read `status` rather than inferring one from an empty `user` — the same empty object means a request that has not settled, a session that expired, and an account with no username. A rejecting `fetchUser` sets `status: "failed"` and is not rethrown.

### Design Tokens

OKLCH-based color system with light/dark mode, CSS variables for theming, consistent radius scale, chart palette, sidebar theme, animations.

**The brand accent is one token, set once.** The tinted icon chip in a page header, the ring around it, an accented label and the solid primary fill all derive from two gradient stops, so a product picks its colour at the root rather than in every component:

```css
:root {
  --vg-accent-from: oklch(70.5% 0.213 47.604);
  --vg-accent-to:   oklch(64.6% 0.222 41.116);
  --vg-accent-text: oklch(55.3% 0.195 38.402);  /* readable on light */
  --vg-accent-text-dark: oklch(75% 0.183 55.934);  /* readable on dark */
}
```

The tint, the strong tint and the hairline (`--vg-accent-surface`, `--vg-accent-surface-strong`, `--vg-accent-line`) are `color-mix` over `--vg-accent-from`, so they follow automatically; only the readable foreground is stated, because contrast is not a mix away. Use `--vg-accent-fg` in a component — it is already resolved for the current theme, so no `dark:` twin is needed.

**Declare them on `:root`, not on a wrapper.** A custom property substitutes its `var()` references where it is *declared*, so the derived tokens above are mixed against the `--vg-accent-from` declared in the preset's `:root`. Re-keying a subtree moves what a utility class mixes on the element — the chip, the solid fill — and leaves the tint, the hairline and the button fill at the root's value. The result looks like a component that half-ignores the theme.

**The accent is not the whole re-key.** `--primary` is the other half, and it is a separate set of properties because it takes one value per ground rather than one value plus a readable pair. It is what the bento rail's active marker, the tile's hover glow, an inline edit's border and the default `Button` fill all read, so a product that sets only the four above leaves those in the preset's neutral:

```css
:root {
  --vg-primary-base: oklch(55.3% 0.195 38.402);
  --vg-primary-base-dark: oklch(75% 0.183 55.934);
  --vg-primary-foreground-base: oklch(0.985 0 0);
  --vg-primary-foreground-base-dark: oklch(0.205 0 0);
}
```

Set the inputs, never `--vg-primary` itself. Your stylesheet is declared after this package's dark block, at the same specificity and in no layer, so a single `--vg-primary` there wins on both grounds and keys the dark one to the light value. The preset reads the inputs per ground, which is why re-keying stays a `:root` edit. The fill carries text, so keep that pair at 4.5:1 on both grounds — usually a deeper step than the gradient stops.

Three utility classes cover the common shapes: `vg-accent-chip` (the tinted gradient chip — pair it with Tailwind's `ring-1`), `vg-accent-text` (an accented label or icon), and `vg-accent-solid` (a solid gradient fill).

`GradientButton` and `GradientSwitch` follow the accent in their primary variants (`default`, `outline`, `ghost`), so a re-key reaches the buttons too; their `secondary`, `destructive` and `success` variants keep fixed semantic hues, because "destructive" does not change colour with the brand.

This is separate from a component's **colour palette**. `SectionCard` (`blue | violet | emerald | amber | rose | cyan`) and `StickySaveBar` (`gray | blue | orange | green`) are keyed by hue — the caller picked that colour deliberately — so re-keying the accent leaves them alone, the same way it leaves the [bento tones](#the-bento-layer) alone.

### i18n

Base translations (EN/PT) for common UI strings: buttons, form labels, dialog text, navigation, theme, and the assistant dock.

## Tech Stack

- React 19, React Router 7, TypeScript
- Tailwind CSS 4 with OKLCH color system
- Radix UI primitives + shadcn/ui patterns
- class-variance-authority (CVA) for component variants
- React Hook Form integration
- TanStack React Table
- i18next (EN/PT)
- Axios with CSRF protection
- Sonner for toast notifications
- Lucide + Tabler icons

## The bento layer

Turing grew a second era of chrome — the frosted tile, the airy hero, the
mosaic — inside one product while this package sat next to it exporting console
chrome. It lives here now: the components, their stylesheet, their strings and
their suites. Turing consumes them through one-line re-exports at the paths its
pages already imported, so a product adopting the layer writes the imports above
rather than a second copy.

What stayed behind is the product's, deliberately: commercial chrome (activation,
quota, the first-run tour) and navigation data. `BentoListPage` takes a `layout`
object rather than fetching one, because where a layout is stored is the
product's business — its API, its cache, its mutation library.

It is a separate entry point, so a console still on the first era carries none
of it:

```ts
import "@viglet/viglet-design-system/bento.css";
import {
  BentoEntityShell,
  BentoListPage,
  BentoFormHero,
  BentoNavRail,
  BentoCommandPalette,
} from "@viglet/viglet-design-system/bento";
```

The stylesheet is a separate import from the components, so a consumer taking
only the layout maths does not pull CSS it never renders. It reads the preset's
tokens, so import the preset too.

"Carries none of it" is measured rather than claimed. `pnpm run build` ends by
bundling three fixtures through this package's own `exports` map, and fails if a
bento module, a bento class name or a run of `bento.css`'s selectors reaches a
consumer that imported only the root entry. `size-budget.json` records what each
entry costs: today the whole root entry is 87 KB gzipped and `./bento` 22 KB,
measured with everything the build externalises left out, so the numbers
describe this package rather than its dependencies. The preset's
`--vg-bento-tone-*` tokens are deliberately not counted as the layer: they ship
with every other token and are about a kilobyte of custom properties.

The test is whether a root consumer carries the subpath's **code**, not whether
the subpath exists. `./floating-formulas-bg` has its own entry *and*
`FloatingFormulasBg` is exported from the root barrel, where `Login` and
`StartupFirst` render it — so its rules are in `./styles` too, and that is
correct rather than a leak. The subpath is for a consumer who wants only that
background.

Every subpath in the table above is also **imported, required and type-checked
as you would use it** on each build: one fixture pulls all fifteen through the
real `exports` map, a CommonJS probe requires the seven that offer it, and a
generated TypeScript probe imports a value from each typed entry and uses it —
so a `types` field resolving to the wrong declarations fails here rather than
turning into `any` in your editor.

That last check found a real one. `"type": "module"` makes Node read any `.js`
as ESM, and the CommonJS entries were named `<entry>.cjs.js`, so every
`require()` of this package failed. They are `<entry>.cjs` now. No product met
it, because every consumer — the Vite ones through their bundler, the Next ones
through the App Router — takes the `import` condition.

**`./bento` requires `react-router-dom`.** The package declares that peer
optional because the root entry does not need it — only `./router` and `./bento`
do, and npm cannot mark a peer required for one entry point and optional for
another. `pnpm run build` fails if any other entry starts importing it, so the
split above stays true rather than becoming folklore.

**`react-hook-form` is a required peer, and `react-router-dom` is the only
optional one.** It was a plain dependency until VDS77, which is the one case
where that is wrong: every other library this package shares state through is a
peer, and this is the one carrying a React context a duplicate would split. The
build already left it for the consumer to supply, so the manifest was promising
something the bundle did not deliver; `scripts/externals.test.ts` now fails if
anything externalised as a peer is declared a dependency again.

[docs/BENTO-AUTHORING.md](docs/BENTO-AUTHORING.md) is the contract for writing a
bento page: the three page shapes, what the package will not hold for you, and
the colour, i18n, accessibility and layout rules that keep two consoles looking
like the same product. Read it before the first screen, not after the fifth.

[docs/BENTO-BOUNDARY.md](docs/BENTO-BOUNDARY.md) says which exports become part
of this package and which stay in the product, and why. Four of them are one
product's commercial offer rendered as cards, and shipping those as chrome would
put that offer in every console.

[docs/reference/](docs/reference/) is the same contract drawn: eight artboards,
one per decision that makes two products built from this package stop looking
like one — the header's set, who owns the reading column, what `--primary`
reaches, the three page shapes, the panel, and both grounds with their ratios.
The catalogue proves a component; these prove the arrangement.

## Contributing

The package manager here is pnpm, matching the Shio, Turing, Dumont, Cloud Home
and Schools workspaces. The Cloud Console and the Roadkeep GUI install with npm,
which is a fact about those repositories and not about this one.

```bash
pnpm install
pnpm lint         # eslint
pnpm typecheck    # tsc -b --force
pnpm test         # vitest
pnpm build        # tsc, vite, and the dist checks
pnpm storybook    # the component catalogue, on :6006
```

CI runs all of those on every push and pull request, and the publish workflow
re-runs them before it releases.

`pnpm build` ends in `scripts/check-dist.mjs`, which fails the build when dist
would be broken for consumers in a way nothing here can see — a declaration
importing through a `node_modules` path, a test artefact in the published tree,
or an `exports` entry the build did not produce.

## License

Apache-2.0
