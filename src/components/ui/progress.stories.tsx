import type { Meta, StoryObj } from "@storybook/react-vite";

import { Progress } from "./progress";

const meta = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  args: {
    value: 50,
  },
  render: (args) => (
    <div className="w-[360px]">
      <Progress {...args} />
    </div>
  ),
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };
export const OneThird: Story = { args: { value: 33 } };
export const TwoThirds: Story = { args: { value: 66 } };
export const Complete: Story = { args: { value: 100 } };

export const Steps: Story = {
  render: () => (
    <div className="flex w-[360px] flex-col gap-4">
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>0 / 100</span>
        </div>
        <Progress value={0} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>33%</span>
          <span>33 / 100</span>
        </div>
        <Progress value={33} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>66%</span>
          <span>66 / 100</span>
        </div>
        <Progress value={66} />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>100%</span>
          <span>100 / 100</span>
        </div>
        <Progress value={100} />
      </div>
    </div>
  ),
};
