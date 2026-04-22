import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Project update</CardTitle>
        <CardDescription>A short summary of recent changes.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          The new release ships improved performance, a redesigned navigation
          and refreshed documentation.
        </p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="w-[360px]">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>You have 3 unread messages.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Mark all read
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li>Your deploy finished successfully.</li>
          <li>A new collaborator joined the project.</li>
          <li>Weekly report is ready.</li>
        </ul>
      </CardContent>
    </Card>
  ),
};

export const Simple: Story = {
  render: (args) => (
    <Card {...args} className="w-[320px]">
      <CardContent>
        <p className="text-sm">A minimal card with only content.</p>
      </CardContent>
    </Card>
  ),
};
