import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";

import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    variant: "default",
    size: "default",
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    "aria-label": "Toggle bold",
    children: <Bold />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    "aria-label": "Toggle italic",
    children: <Italic />,
  },
};

export const WithText: Story = {
  args: {
    "aria-label": "Toggle underline",
    children: (
      <>
        <Underline />
        Underline
      </>
    ),
  },
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Toggle {...args} size="sm" aria-label="Small">
        <Bold />
      </Toggle>
      <Toggle {...args} size="default" aria-label="Default">
        <Bold />
      </Toggle>
      <Toggle {...args} size="lg" aria-label="Large">
        <Bold />
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    "aria-label": "Disabled toggle",
    children: <Bold />,
  },
};
