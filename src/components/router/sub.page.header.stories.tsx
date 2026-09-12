import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconDatabase, IconDownload, IconRefresh } from "@tabler/icons-react";

import { SidebarProvider } from "../ui/sidebar";
import { SubPageHeader } from "./sub.page.header";

/**
 * The console entity header (VDS116 — it had no story, and nothing else
 * rendered it, so the axe pass never reached it).
 *
 * Like `StickyPageHeader.Title`, it reads `useSidebarOptional()` so it can
 * render inside a remote whose host owns no sidebar.
 *
 * Console-era and `@deprecated`. `BentoHero` is the bento equivalent; pair it
 * with `BentoBackLink` for the back target and `BentoActionsMenu` for the menu.
 */
const meta = {
  title: "Console/SubPageHeader",
  component: SubPageHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <SidebarProvider className="min-h-0!" style={{ minHeight: 0 }}>
        <div className="w-full">
          <Story />
        </div>
      </SidebarProvider>
    ),
  ],
  args: {
    icon: IconDatabase,
    feature: "Connector",
    name: "Product catalogue",
    description: "Everything the storefront sells",
    urlBase: "/connectors",
  },
} satisfies Meta<typeof SubPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** `Action` is a marker the header collects into its own menu. */
export const WithActions: Story = {
  args: {
    children: (
      <>
        <SubPageHeader.Action label="Reindex" icon={IconRefresh} onClick={() => {}} />
        <SubPageHeader.Action label="Export" icon={IconDownload} onClick={() => {}} />
      </>
    ),
  },
};

export const WithDelete: Story = {
  args: { onDelete: () => {} },
};
