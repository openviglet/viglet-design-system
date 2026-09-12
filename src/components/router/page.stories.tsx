import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconDatabase } from "@tabler/icons-react";

import { BreadcrumbProvider } from "@/contexts/breadcrumb.context";
import { Page } from "./page";

/**
 * The console page shell (VDS116 — it had no story, and nothing else rendered
 * it, so the axe pass never reached it).
 *
 * It is `PageHeader` plus `PageContent`, and the content is an `<Outlet>`, so
 * what a story can show is the shell: the child is whatever route the product
 * mounted. It reads the breadcrumb trail, so a `BreadcrumbProvider` is what
 * makes the header render.
 *
 * Console-era and `@deprecated`. The bento layer ships no single shell on
 * purpose — a product composes `BentoNavRail`, `BentoUserMenu` and
 * `BentoCommandPalette` instead.
 */
const meta = {
  title: "Console/Page",
  component: Page,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <BreadcrumbProvider>
        <div className="w-full">
          <Story />
        </div>
      </BreadcrumbProvider>
    ),
  ],
  args: { icon: IconDatabase, title: "Connectors" },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
