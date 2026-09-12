import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconDatabase } from "@tabler/icons-react";

import { BlankSlate } from "./blank-slate";

/**
 * The console empty state (VDS116 — it had no story, so the axe pass never
 * reached it).
 *
 * Console-era and `@deprecated`: still exported and still supported, because the
 * cutover has not started in any of the three consoles. `BentoEmptyState` is the
 * bento equivalent for a new page.
 */
const meta = {
  title: "Console/BlankSlate",
  component: BlankSlate,
  tags: ["autodocs"],
  args: {
    icon: IconDatabase,
    title: "No connectors yet",
    description: "A connector is what brings a source's content in. Add one to get started.",
    buttonText: "Add a connector",
  },
} satisfies Meta<typeof BlankSlate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Without `urlNew` there is nowhere to send the reader, so no button renders. */
export const WithoutAnAction: Story = {
  args: { urlNew: undefined },
};

export const WithAnAction: Story = {
  args: { urlNew: "/connectors/new" },
};
