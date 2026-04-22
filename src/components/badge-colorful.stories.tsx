import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "lucide-react";

import { BadgeColorful } from "./badge-colorful";

const meta = {
  title: "App/BadgeColorful",
  component: BadgeColorful,
  tags: ["autodocs"],
  args: {
    text: "marketing",
  },
} satisfies Meta<typeof BadgeColorful>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithPrefix: Story = {
  args: {
    text: "featured",
    prefix: <Tag className="h-3 w-3" />,
  },
};

export const WithLink: Story = {
  args: {
    text: "documentation",
    href: "https://docs.viglet.org",
    onClick: (href) => window.open(href, "_blank"),
  },
};

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {["marketing", "engineering", "design", "research", "sales", "support"].map((label) => (
        <BadgeColorful key={label} text={label} />
      ))}
    </div>
  ),
};
