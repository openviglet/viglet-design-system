import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, Sparkles } from "lucide-react";

import { StartupFirst } from "./startup-first";

const meta = {
  title: "Pages/StartupFirst",
  component: StartupFirst,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    color: "#2563eb",
    colorDark: "#60a5fa",
  },
} satisfies Meta<typeof StartupFirst>;

export default meta;
type Story = StoryObj<typeof meta>;

/** First step of a 3-step wizard. */
export const FirstStep: Story = {
  render: (args) => (
    <StartupFirst {...args}>
      <StartupFirst.Background withOrbs withGrid />
      <StartupFirst.Content>
        <StartupFirst.Steps current={1} total={3} />
        <StartupFirst.Logo>
          <Sparkles className="h-10 w-10 text-[var(--ff-color,#2563eb)]" />
        </StartupFirst.Logo>
        <StartupFirst.Title>Welcome to Viglet Turing ES</StartupFirst.Title>
        <StartupFirst.Description>
          Let&apos;s create your first administrator account so you can start
          indexing content.
        </StartupFirst.Description>
        <StartupFirst.Card>
          <form className="flex flex-col gap-3 p-6">
            <label className="text-sm font-medium" htmlFor="sf-name">
              Full name
            </label>
            <input
              id="sf-name"
              type="text"
              placeholder="Ada Lovelace"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium" htmlFor="sf-email">
              Email
            </label>
            <input
              id="sf-email"
              type="email"
              placeholder="admin@example.com"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <StartupFirst.Hint icon={<Info className="h-3.5 w-3.5 mt-0.5" />}>
              You will be able to invite teammates later.
            </StartupFirst.Hint>
          </form>
        </StartupFirst.Card>
        <StartupFirst.Actions>
          <button
            type="button"
            className="rounded-md border px-4 py-2 text-sm"
            disabled
          >
            Back
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Continue
          </button>
        </StartupFirst.Actions>
        <StartupFirst.Footer>
          Viglet Turing ES — Initial setup
        </StartupFirst.Footer>
      </StartupFirst.Content>
    </StartupFirst>
  ),
};

/** Final step with a different palette. */
export const LastStep: Story = {
  args: { color: "#10b981", colorDark: "#34d399" },
  render: (args) => (
    <StartupFirst {...args}>
      <StartupFirst.Background withOrbs />
      <StartupFirst.Content>
        <StartupFirst.Steps current={3} total={3} />
        <StartupFirst.Logo>
          <Sparkles className="h-10 w-10 text-[var(--ff-color,#10b981)]" />
        </StartupFirst.Logo>
        <StartupFirst.Title>All set!</StartupFirst.Title>
        <StartupFirst.Description>
          Your workspace is ready. You can now sign in and start exploring.
        </StartupFirst.Description>
        <StartupFirst.Card>
          <div className="p-8 text-center text-sm text-muted-foreground">
            Setup complete.
          </div>
        </StartupFirst.Card>
        <StartupFirst.Actions>
          <button type="button" className="rounded-md border px-4 py-2 text-sm">
            Back
          </button>
          <button
            type="button"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to dashboard
          </button>
        </StartupFirst.Actions>
      </StartupFirst.Content>
    </StartupFirst>
  ),
};
