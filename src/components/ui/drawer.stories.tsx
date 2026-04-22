import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex h-[480px] w-[640px] items-center justify-center">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move goal</DrawerTitle>
          <DrawerDescription>Set your daily activity goal.</DrawerDescription>
        </DrawerHeader>
        <div className="p-4 pb-0">
          <p className="text-muted-foreground text-sm">
            Drag the drawer to dismiss or use the actions below.
          </p>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

export const Right: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline">Open from right</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Right side drawer</DrawerTitle>
          <DrawerDescription>
            Useful for navigation or contextual panels.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 text-sm">
          Content slides in from the right edge of the viewport.
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
