import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mail } from "lucide-react";

import { GradientButton } from "./gradient-button";

const meta = {
  title: "UI/GradientButton",
  component: GradientButton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "success", "outline", "ghost"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    children: "Gradient Button",
    variant: "default",
    size: "default",
  },
} satisfies Meta<typeof GradientButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = { args: { variant: "secondary" } };
export const Destructive: Story = { args: { variant: "destructive", children: "Delete" } };
export const Success: Story = { args: { variant: "success", children: "Save" } };
export const Outline: Story = { args: { variant: "outline" } };
export const Ghost: Story = { args: { variant: "ghost" } };

export const Loading: Story = { args: { loading: true, children: "Saving..." } };
export const Disabled: Story = { args: { disabled: true } };

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

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <GradientButton {...args} size="sm">Small</GradientButton>
      <GradientButton {...args} size="default">Default</GradientButton>
      <GradientButton {...args} size="lg">Large</GradientButton>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <GradientButton variant="default">Default</GradientButton>
      <GradientButton variant="secondary">Secondary</GradientButton>
      <GradientButton variant="destructive">Destructive</GradientButton>
      <GradientButton variant="success">Success</GradientButton>
      <GradientButton variant="outline">Outline</GradientButton>
      <GradientButton variant="ghost">Ghost</GradientButton>
    </div>
  ),
};
