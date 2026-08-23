# Viglet Design System

Shared component library, design tokens, hooks, utilities, and i18n for Viglet products (Turing, Dumont, Shio).

**[Browse the component catalogue](https://openviglet.github.io/viglet-design-system/)** — every
component, its variants and its props, rebuilt on each commit to `2026.3`. Look
there before writing a component: the catalogue is the answer to "does this
already exist".

Those three products are the consumers this package holds itself to, declared in
[`consumers.json`](consumers.json) rather than remembered: the render-parity
digest carries one accent per consumer, and CI refuses prose that names two of
them as though it were all three. A fourth console is one entry there, and the
checks widen with it.

## Installation

```bash
pnpm add @viglet/viglet-design-system
```

## Trying a change in a product before publishing

A change here is a change to shared chrome, so the question is always what it
does to Shio, Turing and Dumont — and the answer should not require a
publish. From this checkout:

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
all 22 Unicode subsets of Inter and Plus Jakarta Sans were base64 in the CSS.
Base64 of an already-compressed woff2 does not compress again, which is why
2,276 rules gzipped to 594 KB. Splitting them takes `./styles` to 31 KB gzipped
and lets the faces be cached, preloaded, or dropped by a product already serving
Inter.

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

This package exports two complete page vocabularies. The **console era** is what all three products ship on today; the **[bento layer](#the-bento-layer)** is the current one. Every console-era export is marked `@deprecated` in its own types, so an editor strikes it through and offers the swap.

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

### Hooks

```tsx
import {
  useIsMobile,
  useDateLocale,
  useGridAdapter,
  useSubPageBreadcrumb,
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

### UI Primitives (39 components)

Accordion, Avatar, Badge, Breadcrumb, Button, Card, Checkbox, Dialog, Drawer, DropdownMenu, Form, FormActions, FormItemTwoColumns, GradientButton, GradientSwitch, HoverCard, Input, Label, NavigationMenu, Pagination, Popover, Progress, Resizable, SectionCard, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner (Toaster), Stepper, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

### App Components (23 components)

AppFooter, BadgeColorful, BadgeLocale, DialogDelete, GradientButtonLink, LanguageSelect, LoadProvider, ModeToggle, NavSecondary, ThemeProvider

Console-era, `@deprecated`, still exported — see [the swap table](#two-eras-and-which-one-a-new-page-should-use): BlankSlate, GridList, InternalSidebar, NavMain, NavUser, Page, PageContent, PageHeader, StickyPageHeader, SubPage, SubPageHeader

### Hooks

`useIsMobile`, `useDateLocale`, `useGridAdapter`, `useSubPageBreadcrumb`

### Contexts

`BreadcrumbProvider` / `useBreadcrumb`, `UserProvider` / `useCurrentUser`, `ThemeProvider` / `useTheme`

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

Three utility classes cover the common shapes: `vg-accent-chip` (the tinted gradient chip — pair it with Tailwind's `ring-1`), `vg-accent-text` (an accented label or icon), and `vg-accent-solid` (a solid gradient fill).

`GradientButton` and `GradientSwitch` follow the accent in their primary variants (`default`, `outline`, `ghost`), so a re-key reaches the buttons too; their `secondary`, `destructive` and `success` variants keep fixed semantic hues, because "destructive" does not change colour with the brand.

This is separate from a component's **colour palette**. `SectionCard` (`blue | violet | emerald | amber | rose | cyan`) and `StickySaveBar` (`gray | blue | orange | green`) are keyed by hue — the caller picked that colour deliberately — so re-keying the accent leaves them alone, the same way it leaves the [bento tones](#the-bento-layer) alone.

### i18n

Base translations (EN/PT) for common UI strings: buttons, form labels, dialog text, navigation, theme.

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
chrome. It is being moved here.

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
`.bento-` rule or a bento class name reaches a consumer that imported only the
root entry. `size-budget.json` records what each entry costs — today the whole
root entry is 87 KB gzipped and `./bento` 22 KB, measured with everything the
build externalises left out, so the numbers describe this package rather than
its dependencies. The preset's `--vg-bento-tone-*` tokens are deliberately not
counted as the layer: they ship with every other token and are about a kilobyte
of custom properties.

**`./bento` requires `react-router-dom`.** The package declares that peer
optional because the root entry does not need it — only `./router` and `./bento`
do, and npm cannot mark a peer required for one entry point and optional for
another. `pnpm run build` fails if any other entry starts importing it, so the
split above stays true rather than becoming folklore.

[docs/BENTO-AUTHORING.md](docs/BENTO-AUTHORING.md) is the contract for writing a
bento page: the three page shapes, what the package will not hold for you, and
the colour, i18n, accessibility and layout rules that keep two consoles looking
like the same product. Read it before the first screen, not after the fifth.

[docs/BENTO-BOUNDARY.md](docs/BENTO-BOUNDARY.md) says which exports become part
of this package and which stay in the product, and why. Four of them are one
product's commercial offer rendered as cards, and shipping those as chrome would
put that offer in every console.

## Contributing

The package manager is pnpm, matching the Shio, Turing and Dumont workspaces.

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
