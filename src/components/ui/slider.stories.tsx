import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider } from "./slider";

const meta = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
    disabled: { control: "boolean" },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    defaultValue: [50],
  },
  render: (args) => (
    <div className="w-80">
      <Slider {...args} />
    </div>
  ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Range: Story = {
  args: { defaultValue: [25, 75] },
};

export const Stepped: Story = {
  args: { step: 10, defaultValue: [30] },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: [40] },
};

export const Vertical: Story = {
  render: (args) => (
    <div className="h-60">
      <Slider orientation="vertical" {...args} />
    </div>
  ),
};
