import type { Meta, StoryObj } from "@storybook/react-vite";
import { Cloud } from "lucide-react";

import { AppFooter } from "./app-footer";

const meta = {
  title: "App/AppFooter",
  component: AppFooter,
  tags: ["autodocs"],
  args: {
    productName: "Viglet Cloud",
    version: "2026.2.50",
  },
} satisfies Meta<typeof AppFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLogo: Story = {
  args: {
    logo: <Cloud className="h-4 w-4 text-muted-foreground" />,
  },
};

export const WithLinks: Story = {
  args: {
    links: [
      { label: "Privacy", href: "https://viglet.com/privacy" },
      { label: "Terms", href: "https://viglet.com/terms" },
      { label: "Docs", href: "https://docs.viglet.org" },
    ],
  },
};

export const Full: Story = {
  args: {
    logo: <Cloud className="h-4 w-4 text-muted-foreground" />,
    links: [
      { label: "Privacy", href: "https://viglet.com/privacy" },
      { label: "Terms", href: "https://viglet.com/terms" },
      { label: "Docs", href: "https://docs.viglet.org" },
    ],
  },
};
