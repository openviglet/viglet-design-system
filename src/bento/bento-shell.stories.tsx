import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2, IconDatabase, IconSettings } from "@tabler/icons-react";
import { useEffect, useState } from "react";

import { BentoBackToTop } from "./bento-back-to-top";
import {
  BentoCommandPalette,
  type BentoCommandPaletteResult,
} from "./bento-command-palette";
import type { BentoNavGroup, BentoNavItem } from "./bento-nav";
import { BentoNavRail } from "./bento-nav-rail";
import { BentoShortcutsDialog } from "./bento-shortcuts-dialog";
import { BentoUserMenu } from "./bento-user-menu";
import { UserProvider } from "@/contexts/user.context";

/**
 * The shell: a fixed rail down the left, a command palette on ⌘K, and the
 * back-to-top. No sidebar provider and no context between them — the rail is
 * fixed, one width, and hidden below `md`, so there is no state to share.
 *
 * Every route here is supplied by the story, because a product's map of itself
 * is the one thing this package never holds.
 */
const items: BentoNavItem[] = [
  {
    id: "models",
    titleKey: "Language models",
    descriptionKey: "Every model this install can reach",
    icon: IconCpu2,
    section: "ai",
    tone: "blue",
    bentoRoute: "/ai/models",
    fallbackRoute: "/admin/llm",
  },
  {
    id: "indexing",
    titleKey: "Indexing",
    descriptionKey: "Crawlers and schedules",
    icon: IconDatabase,
    section: "search",
    tone: "emerald",
    fallbackRoute: "/admin/indexing",
  },
];

const groups: BentoNavGroup[] = [
  { section: { id: "ai", labelKey: "Generative AI", icon: IconCpu2, areaRoute: "/ai" }, items: [items[0]] },
  { section: { id: "search", labelKey: "Search", icon: IconDatabase, areaRoute: "/search" }, items: [items[1]] },
  { section: { id: "manage", labelKey: "Management", icon: IconSettings, areaRoute: "/manage" }, items: [] },
];

const meta = {
  title: "Bento/Shell",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NavRail: Story = {
  render: () => (
    <div className="bento-rail-gutter min-h-96">
      <BentoNavRail groups={groups} homeRoute="/" homeLabel="Home" />
      <div className="p-6 text-sm text-muted-foreground">
        Page content clears the rail through <code>bento-rail-gutter</code>.
      </div>
    </div>
  ),
};

export const CommandPalette: Story = {
  render: () => <BentoCommandPalette open onOpenChange={() => {}} items={items} />,
};

/**
 * The second group, whose items the product supplies per query. The palette
 * renders them in the order given and never re-ranks them, because the product
 * asked its own source and that order is the answer. Here the "source" is a
 * timeout, which is what makes the pending line visible.
 */
export const CommandPaletteWithProductResults: Story = {
  render: function ProductResultsStory() {
    const [query, setQuery] = useState("");
    const [pending, setPending] = useState(false);
    const [results, setResults] = useState<BentoCommandPaletteResult[]>([]);

    useEffect(() => {
      if (!query) {
        setResults([]);
        setPending(false);
        return;
      }
      setPending(true);
      const timer = setTimeout(() => {
        setResults([
          { id: "r1", label: `Quarterly report — ${query}`, description: "2026 Q1" },
          { id: "r2", label: `Annual report — ${query}`, description: "2025" },
        ]);
        setPending(false);
      }, 400);
      return () => clearTimeout(timer);
    }, [query]);

    return (
      <BentoCommandPalette
        open
        onOpenChange={() => {}}
        items={items}
        onQueryChange={setQuery}
        group={{
          label: "Documents",
          items: results,
          pending,
          onSelect: (item) => console.log("chose", item.id),
        }}
      />
    );
  },
};

export const ShortcutsDialog: Story = {
  render: () => <BentoShortcutsDialog open onOpenChange={() => {}} isMac={false} />,
};

export const ShortcutsDialogOnMac: Story = {
  render: () => <BentoShortcutsDialog open onOpenChange={() => {}} isMac />,
};

export const BackToTop: Story = {
  render: function BackToTopStory() {
    const [, force] = useState(0);
    return (
      <div className="min-h-[150vh] p-6" onScroll={() => force((n) => n + 1)}>
        <p className="text-sm text-muted-foreground">
          Scroll down — the button appears once the page has moved.
        </p>
        <BentoBackToTop />
      </div>
    );
  },
};

/**
 * The header's user menu. Its entries are routes rather than feature flags: a
 * product shows the tenancy items by supplying their routes, and hides them by
 * not — so the package never mirrors a feature model it cannot see.
 */
export const UserMenu: Story = {
  render: () => (
    <UserProvider
      fetchUser={async () => ({
        username: "ana",
        firstName: "Ana",
        lastName: "Silva",
        email: "ana@example.com",
        admin: false,
      })}
    >
      <div className="flex justify-end p-6">
        <BentoUserMenu
          accountRoute="/account"
          logoutUrl="/logout"
          organizationsRoute="/organizations"
          onOpenShortcuts={() => {}}
        />
      </div>
    </UserProvider>
  ),
};
