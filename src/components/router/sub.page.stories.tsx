import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconChartBar, IconDatabase, IconFileText, IconSettings } from "@tabler/icons-react";

import type { NavMainItem } from "./internal.sidebar";
import { SubPage } from "./sub.page";

/**
 * The console entity shell (VDS116 — it had no story, so the axe pass never
 * reached it).
 *
 * `SubPage` is `InternalSidebar` plus the inset its routed children render into.
 * The content area is an `<Outlet>`, so it is empty here: what a story can show
 * is the shell, and the child is whatever route the product mounted.
 *
 * Console-era and `@deprecated`. `BentoEntityShell` is the bento equivalent.
 */

const navMain: NavMainItem[] = [
  { title: "Overview", url: "/detail", icon: IconFileText },
  { title: "Settings", url: "/settings", icon: IconSettings },
  { title: "Reporting", url: "/reporting", icon: IconChartBar },
];

const meta = {
  title: "Console/SubPage",
  component: SubPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    icon: IconDatabase,
    feature: "Connector",
    name: "Product catalogue",
    urlBase: "/connectors/1",
    data: { navMain },
  },
} satisfies Meta<typeof SubPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** VDS76 — `compact` drops the outer padding for a page that already has chrome. */
export const Compact: Story = {
  args: { density: "compact" },
};
