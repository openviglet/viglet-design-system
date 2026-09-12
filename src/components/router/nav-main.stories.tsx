import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconChartBar, IconDatabase, IconSettings } from "@tabler/icons-react";

import { SidebarProvider } from "../ui/sidebar";
import { NavMain } from "./nav-main";

/**
 * The console primary navigation (VDS116 — it had no story, and nothing else
 * rendered it, so the axe pass never reached it).
 *
 * It reads `useSidebar()`, so a `SidebarProvider` is what makes it render.
 *
 * Console-era and `@deprecated`, like the rest of this block.
 */
const meta = {
  title: "Console/NavMain",
  component: NavMain,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0! w-72" style={{ minHeight: 0 }}>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: {
    groups: [
      {
        items: [
          { title: "Connectors", url: "/connectors", icon: IconDatabase },
          { title: "Reporting", url: "/reporting", icon: IconChartBar },
        ],
      },
    ],
  },
} satisfies Meta<typeof NavMain>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A labelled group is how a console separates areas of the product. */
export const Grouped: Story = {
  args: {
    groups: [
      {
        label: "Content",
        items: [{ title: "Connectors", url: "/connectors", icon: IconDatabase }],
      },
      {
        label: "Administration",
        items: [{ title: "Settings", url: "/settings", icon: IconSettings }],
      },
    ],
  },
};
