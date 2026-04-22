import type { Meta, StoryObj } from "@storybook/react-vite";

import { GlassCard } from "./glass-card";

const meta = {
  title: "UI/GlassCard",
  component: GlassCard,
  tags: ["autodocs"],
  argTypes: {
    color: { control: "color" },
    colorDark: { control: "color" },
  },
} satisfies Meta<typeof GlassCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[400px]">
      <GlassCard {...args}>
        <h2 className="text-xl font-semibold mb-2">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to your account to continue where you left off.
        </p>
        <div className="space-y-2 text-sm">
          <p>Glassmorphism container used by login, onboarding and hero cards.</p>
        </div>
      </GlassCard>
    </div>
  ),
};

export const WithAccentColor: Story = {
  args: {
    color: "#10b981",
  },
  render: (args) => (
    <div className="w-[400px]">
      <GlassCard {...args}>
        <h2 className="text-xl font-semibold mb-2">Green accent</h2>
        <p className="text-sm text-muted-foreground">
          Tint is driven by the <code>--glass-card-color</code> property.
        </p>
      </GlassCard>
    </div>
  ),
};

export const LoginExample: Story = {
  render: () => (
    <div className="w-[420px]">
      <GlassCard>
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your workspace.
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>
          <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Continue
          </button>
        </div>
      </GlassCard>
    </div>
  ),
};
