# Viglet Design System

Shared component library, design tokens, hooks, utilities, and i18n for Viglet products (Turing, Dumont, Shio).

**[Browse the component catalogue](https://openviglet.github.io/viglet-design-system/)** — every
component, its variants and its props, rebuilt on each commit to `2026.3`. Look
there before writing a component: the catalogue is the answer to "does this
already exist".

## Installation

```bash
pnpm add @viglet/viglet-design-system
```

## Trying a change in a product before publishing

A change here is a change to shared chrome, so the question is always what it
does to Shio and Turing — and the answer should not require a publish. From this
checkout:

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
  PageHeader,
  SubPageHeader,
  GridList,
  DialogDelete,
  BlankSlate,
  LoadProvider,
  NavUser,
  AppFooter,
  LanguageSelect,
  ModeToggle,
} from "@viglet/viglet-design-system";
```

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

AppFooter, BadgeColorful, BadgeLocale, BlankSlate, DialogDelete, GridList, InternalSidebar, LanguageSelect, LoadProvider, ModeToggle, NavMain, NavSecondary, NavUser, Page, PageContent, PageHeader, SubPage, SubPageHeader, ThemeProvider

### Hooks

`useIsMobile`, `useDateLocale`, `useGridAdapter`, `useSubPageBreadcrumb`

### Contexts

`BreadcrumbProvider` / `useBreadcrumb`, `UserProvider` / `useCurrentUser`, `ThemeProvider` / `useTheme`

### Design Tokens

OKLCH-based color system with light/dark mode, CSS variables for theming, consistent radius scale, chart palette, sidebar theme, animations.

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

## Contributing

The package manager is pnpm, matching the Shio and Turing workspaces.

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
