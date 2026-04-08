# Viglet Design System

Shared component library, design tokens, hooks, utilities, and i18n for Viglet products (Turing, Dumont, Shio).

## Installation

```bash
npm install @viglet/viglet-design-system
```

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

## License

Apache-2.0
