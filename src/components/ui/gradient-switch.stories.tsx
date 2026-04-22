import type { Meta, StoryObj } from "@storybook/react-vite";

import { GradientSwitch } from "./gradient-switch";

const meta = {
  title: "UI/GradientSwitch",
  component: GradientSwitch,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "success"],
    },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
  },
  args: {
    variant: "default",
  },
} satisfies Meta<typeof GradientSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };
export const Secondary: Story = { args: { variant: "secondary", defaultChecked: true } };
export const Destructive: Story = { args: { variant: "destructive", defaultChecked: true } };
export const Success: Story = { args: { variant: "success", defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <GradientSwitch variant="default" defaultChecked />
        <span className="text-sm">Default</span>
      </div>
      <div className="flex items-center gap-3">
        <GradientSwitch variant="secondary" defaultChecked />
        <span className="text-sm">Secondary</span>
      </div>
      <div className="flex items-center gap-3">
        <GradientSwitch variant="destructive" defaultChecked />
        <span className="text-sm">Destructive</span>
      </div>
      <div className="flex items-center gap-3">
        <GradientSwitch variant="success" defaultChecked />
        <span className="text-sm">Success</span>
      </div>
    </div>
  ),
};
