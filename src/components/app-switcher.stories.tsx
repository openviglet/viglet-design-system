import type { Meta, StoryObj } from "@storybook/react-vite";
import { Book, Cloud, Home, Search } from "lucide-react";
import { useState } from "react";

import { AppSwitcher, type AppSwitcherItem } from "./app-switcher";

const sampleApps: AppSwitcherItem[] = [
  {
    id: "cloud",
    name: "Viglet Cloud",
    icon: <Cloud className="h-4 w-4" />,
    iconBg: "bg-linear-to-br from-[#C2410C] to-[#F97316]",
    href: "/",
    active: true,
  },
  {
    id: "turing",
    name: "Turing ES",
    icon: <Search className="h-4 w-4" />,
    iconBg: "bg-linear-to-br from-sky-500 to-blue-600",
    href: "https://turing.viglet.cloud",
    external: true,
  },
  {
    id: "shio",
    name: "Shio CMS",
    icon: <Home className="h-4 w-4" />,
    iconBg: "bg-linear-to-br from-emerald-500 to-green-600",
    href: "https://shio.viglet.cloud",
    external: true,
  },
  {
    id: "docs",
    name: "Documentation",
    icon: <Book className="h-4 w-4" />,
    iconBg: "bg-linear-to-br from-violet-500 to-purple-600",
    href: "https://docs.viglet.org",
    external: true,
  },
];

const meta = {
  title: "App/AppSwitcher",
  component: AppSwitcher,
  tags: ["autodocs"],
  args: {
    apps: sampleApps,
    open: false,
    onToggle: () => {},
    triggerTitle: "Apps",
    closeLabel: "Close app switcher",
    showTrigger: true,
    headerHeight: 56,
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <div className="relative min-h-[300px]">
        <AppSwitcher {...args} open={open} onToggle={() => setOpen((v) => !v)} />
      </div>
    );
  },
} satisfies Meta<typeof AppSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const PanelOnly: Story = {
  args: { open: true, showTrigger: false },
};
