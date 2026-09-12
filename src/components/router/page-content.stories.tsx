import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageContent } from "./page-content";

/**
 * The console page's content well (VDS116 — it had no story, and nothing else
 * rendered it, so the axe pass never reached it).
 *
 * It takes no props: it is the container spacing around an `<Outlet>`, so what
 * renders inside it is whatever route the product mounted, and here that is
 * nothing.
 *
 * Console-era and `@deprecated`, like the rest of this block.
 */
const meta = {
  title: "Console/PageContent",
  component: PageContent,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
