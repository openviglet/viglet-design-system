import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeProvider } from "./theme-provider";
import { ModeToggle, ModeToggleSidebar } from "./mode-toggle";

const meta = {
  title: "App/ModeToggle",
  component: ModeToggle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider defaultTheme="system" storageKey="storybook-ui-theme">
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dropdown with light / dark / system options — used in the app header. */
export const Default: Story = {};

/** Sidebar (mobile) variant — cycles through themes on click. */
export const Sidebar: StoryObj<typeof ModeToggleSidebar> = {
  render: () => (
    <div className="w-64 rounded-md border bg-sidebar p-2">
      <ModeToggleSidebar />
    </div>
  ),
};
