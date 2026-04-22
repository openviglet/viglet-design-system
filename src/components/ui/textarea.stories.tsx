import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "./textarea";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    rows: { control: "number" },
  },
  args: {
    placeholder: "Type your message here...",
  },
  render: (args) => (
    <div className="w-80">
      <Textarea {...args} />
    </div>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true, value: "Cannot edit this." },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "Something is wrong" },
};

export const WithRows: Story = {
  args: { rows: 6 },
};
