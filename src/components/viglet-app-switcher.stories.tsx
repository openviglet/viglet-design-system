import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { VigletAppSwitcher } from "./viglet-app-switcher";

// The switcher is controlled, so the story owns the open state. Hooks live in a
// named component rather than in `render` so the rules-of-hooks lint still applies.
function ControlledSwitcher(
  args: React.ComponentProps<typeof VigletAppSwitcher>,
) {
  const [open, setOpen] = useState(args.open);
  return (
    <div className="relative min-h-[360px]">
      <VigletAppSwitcher
        {...args}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
    </div>
  );
}

const meta = {
  title: "App/VigletAppSwitcher",
  component: VigletAppSwitcher,
  tags: ["autodocs"],
  args: {
    open: false,
    onToggle: () => {},
    activeProduct: "cloud",
    headerHeight: 56,
  },
  argTypes: {
    activeProduct: {
      control: "select",
      options: ["cloud", "turing", "shio", "dumont"],
    },
  },
  render: (args) => <ControlledSwitcher {...args} />,
} satisfies Meta<typeof VigletAppSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const CloudActive: Story = {
  args: { open: true, activeProduct: "cloud" },
};

export const TuringActive: Story = {
  args: { open: true, activeProduct: "turing" },
};

export const ShioActive: Story = {
  args: { open: true, activeProduct: "shio" },
};

export const DumontActive: Story = {
  args: { open: true, activeProduct: "dumont" },
};

export const CustomUrls: Story = {
  args: {
    open: true,
    activeProduct: "turing",
    urls: {
      cloud: "https://staging.cloud.example.com",
      turing: "https://staging.turing.example.com",
      shio: "https://staging.shio.example.com",
      dumont: "https://staging.dumont.example.com",
      docs: "https://staging.docs.example.com",
    },
  },
};
