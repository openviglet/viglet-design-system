import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";

const meta = {
  title: "UI/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@viglet</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between gap-4">
          <div className="flex size-10 items-center justify-center rounded-full border bg-muted text-sm font-medium">
            V
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">@viglet</h4>
            <p className="text-sm">
              Open source building blocks for modern web products.
            </p>
            <p className="text-muted-foreground text-xs">
              Joined December 2021
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const RightSide: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </HoverCardTrigger>
      <HoverCardContent side="right">
        <p className="text-sm">
          The hover card can be positioned on any side of the trigger.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};
