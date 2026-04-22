import type { Meta, StoryObj } from "@storybook/react-vite";

import { Skeleton } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Skeleton {...args} className="h-4 w-[250px]" />,
};

export const TextLine: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton className="h-4 w-[320px]" />
      <Skeleton className="h-4 w-[260px]" />
      <Skeleton className="h-4 w-[180px]" />
    </div>
  ),
};

export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Skeleton className="size-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[180px]" />
        <Skeleton className="h-3 w-[140px]" />
      </div>
    </div>
  ),
};

export const Card: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[360px]">
      <Skeleton className="h-[160px] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-[240px]" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
    </div>
  ),
};
