import type { Meta, StoryObj } from "@storybook/react-vite";

import { PulseRing } from "./pulse-ring";

const meta = {
  title: "UI/PulseRing",
  component: PulseRing,
  tags: ["autodocs"],
  argTypes: {
    color: { control: "color" },
    colorDark: { control: "color" },
    paused: { control: "boolean" },
  },
} satisfies Meta<typeof PulseRing>;

export default meta;
type Story = StoryObj<typeof meta>;

const LogoBox = () => (
  <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold">
    V
  </div>
);

export const Default: Story = {
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <PulseRing {...args}>
        <LogoBox />
      </PulseRing>
    </div>
  ),
};

export const Paused: Story = {
  args: { paused: true },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <PulseRing {...args}>
        <LogoBox />
      </PulseRing>
    </div>
  ),
};

export const GreenAccent: Story = {
  args: { color: "#10b981" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <PulseRing {...args}>
        <LogoBox />
      </PulseRing>
    </div>
  ),
};

export const RoseAccent: Story = {
  args: { color: "#f43f5e" },
  render: (args) => (
    <div className="flex items-center justify-center p-16">
      <PulseRing {...args}>
        <LogoBox />
      </PulseRing>
    </div>
  ),
};
