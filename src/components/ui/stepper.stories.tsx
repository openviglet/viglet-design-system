import type { Meta, StoryObj } from "@storybook/react-vite";

import { Stepper } from "./stepper";

const meta = {
  title: "UI/Stepper",
  component: Stepper,
  tags: ["autodocs"],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    completedSteps: [true, true, false, false],
  },
  render: (args) => (
    <div className="w-[400px]">
      <Stepper {...args}>
        <Stepper.Step index={0}>
          <h3 className="text-sm font-semibold">Create account</h3>
          <p className="text-muted-foreground text-xs">
            Sign up with your email address.
          </p>
        </Stepper.Step>
        <Stepper.Step index={1}>
          <h3 className="text-sm font-semibold">Verify email</h3>
          <p className="text-muted-foreground text-xs">
            Confirm your email to continue.
          </p>
        </Stepper.Step>
        <Stepper.Step index={2}>
          <h3 className="text-sm font-semibold">Set up profile</h3>
          <p className="text-muted-foreground text-xs">
            Add your name and avatar.
          </p>
        </Stepper.Step>
        <Stepper.Step index={3}>
          <h3 className="text-sm font-semibold">Invite team</h3>
          <p className="text-muted-foreground text-xs">
            Invite members to your workspace.
          </p>
        </Stepper.Step>
        <Stepper.Completion />
      </Stepper>
    </div>
  ),
};

export const AllCompleted: Story = {
  args: {
    completedSteps: [true, true, true, true],
  },
  render: (args) => (
    <div className="w-[400px]">
      <Stepper {...args}>
        <Stepper.Step index={0}>
          <h3 className="text-sm font-semibold">Create account</h3>
        </Stepper.Step>
        <Stepper.Step index={1}>
          <h3 className="text-sm font-semibold">Verify email</h3>
        </Stepper.Step>
        <Stepper.Step index={2}>
          <h3 className="text-sm font-semibold">Set up profile</h3>
        </Stepper.Step>
        <Stepper.Step index={3}>
          <h3 className="text-sm font-semibold">Invite team</h3>
        </Stepper.Step>
        <Stepper.Completion />
      </Stepper>
    </div>
  ),
};

export const Empty: Story = {
  args: {
    completedSteps: [false, false, false],
  },
  render: (args) => (
    <div className="w-[400px]">
      <Stepper {...args}>
        <Stepper.Step index={0}>
          <h3 className="text-sm font-semibold">Choose plan</h3>
        </Stepper.Step>
        <Stepper.Step index={1}>
          <h3 className="text-sm font-semibold">Payment info</h3>
        </Stepper.Step>
        <Stepper.Step index={2}>
          <h3 className="text-sm font-semibold">Confirmation</h3>
        </Stepper.Step>
        <Stepper.Completion />
      </Stepper>
    </div>
  ),
};
