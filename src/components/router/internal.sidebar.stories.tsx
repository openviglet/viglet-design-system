import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconChartBar, IconDatabase, IconFileText, IconSettings } from "@tabler/icons-react";

import { SidebarProvider } from "../ui/sidebar";
import { InternalSidebar, type NavMainItem } from "./internal.sidebar";

/**
 * The console entity sidebar (VDS116 — it had no story, so the axe pass never
 * reached it).
 *
 * It reads `useSidebar()`, so a `SidebarProvider` is what makes it render at
 * all; `SubPage` is the component that normally supplies one.
 *
 * Console-era and `@deprecated`, like the rest of this block.
 */

const navMain: NavMainItem[] = [
  { title: "Overview", url: "/detail", icon: IconFileText },
  { title: "Settings", url: "/settings", icon: IconSettings },
  {
    // VDS76 — children and no url: a heading over related sub-pages rather than
    // an invented clickable parent.
    title: "Reporting",
    icon: IconChartBar,
    children: [
      { title: "Traffic", url: "/reporting/traffic" },
      { title: "Queries", url: "/reporting/queries" },
    ],
  },
];

const meta = {
  title: "Console/InternalSidebar",
  component: InternalSidebar,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0!" style={{ minHeight: 0 }}>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: {
    icon: IconDatabase,
    feature: "Connector",
    name: "Product catalogue",
    urlBase: "/connectors/1",
    data: { navMain },
  },
} satisfies Meta<typeof InternalSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithCounts: Story = {
  args: {
    data: {
      navMain,
      counts: [
        { title: "Documents", count: 128_402, icon: IconFileText },
        { title: "Queries", count: 3_114, icon: IconChartBar },
      ],
    },
  },
};

/** Being created: the entity has no counts yet and most destinations do not exist. */
export const WhileNew: Story = {
  args: { isNew: true, name: "Untitled connector" },
};
