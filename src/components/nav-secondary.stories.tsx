import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconHelp, IconSearch, IconSettings } from "@tabler/icons-react";

import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { NavSecondary } from "./nav-secondary";

const meta = {
  title: "App/NavSecondary",
  component: NavSecondary,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <Story />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    ),
  ],
  args: {
    items: [
      { title: "Settings", url: "#", icon: IconSettings },
      { title: "Get Help", url: "#", icon: IconHelp },
      { title: "Search", url: "#", icon: IconSearch },
    ],
  },
} satisfies Meta<typeof NavSecondary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleItem: Story = {
  args: {
    items: [{ title: "Settings", url: "#", icon: IconSettings }],
  },
};
