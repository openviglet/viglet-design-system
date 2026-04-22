import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer.
          </PopoverDescription>
        </PopoverHeader>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Width</span>
            <span>100%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Height</span>
            <span>auto</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};

export const TopAligned: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Top</Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start">
        <PopoverHeader>
          <PopoverTitle>Top start</PopoverTitle>
          <PopoverDescription>
            Popover positioned above the trigger, aligned to the start.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};
