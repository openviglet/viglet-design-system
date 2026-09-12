import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconDatabase } from "@tabler/icons-react";

import { BreadcrumbProvider } from "@/contexts/breadcrumb.context";
import { GradientButton } from "../ui/gradient-button";
import { PageHeader } from "./page-header";

/**
 * The console page header (VDS116 — it had no story, so the axe pass never
 * reached it).
 *
 * It reads the breadcrumb trail rather than taking one, so a `BreadcrumbProvider`
 * is what makes it render anything: the header's back affordance is the trail's
 * second-to-last entry.
 *
 * Console-era and `@deprecated`. `BentoHero` is the bento equivalent, and takes
 * a tone so the chip follows the product accent rather than the component.
 */
const meta = {
  title: "Console/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <BreadcrumbProvider>
        <div className="w-full">
          <Story />
        </div>
      </BreadcrumbProvider>
    ),
  ],
  args: {
    icon: IconDatabase,
    title: "Connectors",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    children: <GradientButton size="sm">Add a connector</GradientButton>,
  },
};
