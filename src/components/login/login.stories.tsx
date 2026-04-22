import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search, Sparkles, Zap } from "lucide-react";

import { Login } from "./login";

const meta = {
  title: "Pages/Login",
  component: Login,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    color: "#2563eb",
    colorDark: "#60a5fa",
  },
} satisfies Meta<typeof Login>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Full composition using every Login sub-component. */
export const Default: Story = {
  render: (args) => (
    <Login {...args}>
      <Login.Background withLightning />
      <Login.Content>
        <Login.Logo>
          <Zap className="h-8 w-8 text-[var(--ff-color,#2563eb)]" />
        </Login.Logo>
        <Login.Title>Viglet Turing ES</Login.Title>
        <Login.Tagline>
          Enterprise search intelligence — secure, fast, and AI-powered.
        </Login.Tagline>
        <Login.Features>
          <Login.FeaturePill icon={<Search className="h-3.5 w-3.5" />}>
            Semantic search
          </Login.FeaturePill>
          <Login.FeaturePill icon={<Sparkles className="h-3.5 w-3.5" />}>
            AI insights
          </Login.FeaturePill>
        </Login.Features>
        <Login.Card>
          <form className="flex flex-col gap-3 p-6">
            <label className="text-sm font-medium" htmlFor="login-user">
              Username
            </label>
            <input
              id="login-user"
              type="text"
              placeholder="admin"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <label className="text-sm font-medium" htmlFor="login-pass">
              Password
            </label>
            <input
              id="login-pass"
              type="password"
              placeholder="••••••••"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Sign in
            </button>
          </form>
        </Login.Card>
        <Login.Footer>
          Viglet Turing ES — Enterprise Search Intelligence
        </Login.Footer>
      </Login.Content>
    </Login>
  ),
};

/** Alternative palette (Cloud orange). */
export const CloudPalette: Story = {
  args: { color: "#C2410C", colorDark: "#F97316" },
  render: (args) => (
    <Login {...args}>
      <Login.Background />
      <Login.Content>
        <Login.Logo>
          <Zap className="h-8 w-8 text-[var(--ff-color,#C2410C)]" />
        </Login.Logo>
        <Login.Title>Viglet Cloud</Login.Title>
        <Login.Tagline>
          The unified control plane for every Viglet product.
        </Login.Tagline>
        <Login.Card>
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sign-in form goes here.
          </div>
        </Login.Card>
        <Login.Footer>Viglet Cloud — Unified Console</Login.Footer>
      </Login.Content>
    </Login>
  ),
};
