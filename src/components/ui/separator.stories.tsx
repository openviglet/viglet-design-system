import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[360px] space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">Radix UI</h4>
        <p className="text-muted-foreground text-sm">
          An open-source UI component library.
        </p>
      </div>
      <Separator {...args} />
      <div className="flex h-5 items-center space-x-4 text-sm">
        <div>Blog</div>
        <Separator orientation="vertical" />
        <div>Docs</div>
        <Separator orientation="vertical" />
        <div>Source</div>
      </div>
    </div>
  ),
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <div className="w-[360px]">
      <div className="text-sm">Above</div>
      <Separator {...args} className="my-2" />
      <div className="text-sm">Below</div>
    </div>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Left</span>
      <Separator {...args} />
      <span>Middle</span>
      <Separator {...args} />
      <span>Right</span>
    </div>
  ),
};
