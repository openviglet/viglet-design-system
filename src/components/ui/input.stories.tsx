import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./input";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search", "tel", "url"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
  args: {
    type: "text",
    placeholder: "Type something...",
  },
  render: (args) => (
    <div className="w-72">
      <Input {...args} />
    </div>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Email: Story = {
  args: { type: "email", placeholder: "you@example.com" },
};

export const Password: Story = {
  args: { type: "password", placeholder: "••••••••" },
};

export const Disabled: Story = {
  args: { disabled: true, value: "Disabled value" },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "invalid@" },
};
