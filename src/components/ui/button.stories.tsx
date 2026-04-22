import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mail } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Link: Story = { args: { variant: "link", children: "Learn more" } };

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Mail />
        Email
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    size: "icon",
    "aria-label": "Send email",
    children: <Mail />,
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Button {...args} size="sm">Small</Button>
      <Button {...args} size="default">Default</Button>
      <Button {...args} size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };
