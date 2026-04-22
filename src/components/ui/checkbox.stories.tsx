import type { Meta, StoryObj } from "@storybook/react-vite";

import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    checked: {
      control: "select",
      options: [true, false, "indeterminate"],
    },
    disabled: { control: "boolean" },
  },
  args: {
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { checked: true } };

export const Indeterminate: Story = { args: { checked: "indeterminate" } };

export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: (args) => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox {...args} />
      Accept terms and conditions
    </label>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox defaultChecked />
        Email notifications
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox />
        Push notifications
      </label>
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox disabled />
        SMS notifications (disabled)
      </label>
    </div>
  ),
};
