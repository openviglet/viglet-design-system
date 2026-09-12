import type { Meta, StoryObj } from "@storybook/react-vite";

import type { VigUser } from "@/models";
import { SidebarProvider } from "../ui/sidebar";
import { NavUser } from "./nav-user";

/**
 * The console account menu (VDS116 — it had no story, and nothing else rendered
 * it, so the axe pass never reached it).
 *
 * Console-era and `@deprecated`, like the rest of this block.
 */

const user: VigUser = {
  username: "asilva",
  firstName: "Ana",
  lastName: "Silva",
  email: "ana.silva@example.test",
  admin: true,
};

const meta = {
  title: "Console/NavUser",
  component: NavUser,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0! w-72" style={{ minHeight: 0 }}>
        <Story />
      </SidebarProvider>
    ),
  ],
  args: { user },
} satisfies Meta<typeof NavUser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAccountAndLogout: Story = {
  args: { accountUrl: "/account", logoutUrl: "/logout" },
};
