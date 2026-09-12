import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconDatabase, IconDownload, IconTrash } from "@tabler/icons-react";

import { SidebarProvider } from "../ui/sidebar";
import { StickyPageHeader } from "./sticky.page.header";

/**
 * The console sub-page header that fades as the page scrolls (VDS116 — it had
 * no story, and nothing else rendered it, so the axe pass never reached it).
 *
 * `Title` reads `useSidebarOptional()` rather than `useSidebar()`, so it renders
 * in a Module Federation remote whose host owns no sidebar; the provider below
 * is what gives it the mobile branch.
 *
 * Console-era and `@deprecated`. `useBentoScrollFade` is the bento equivalent,
 * and separates the scroll state from the chrome so the same fade drives a
 * header, a save bar or anything else.
 */
const meta = {
  title: "Console/StickyPageHeader",
  component: StickyPageHeader,
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
} satisfies Meta<typeof StickyPageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <StickyPageHeader.Title
        icon={IconDatabase}
        feature="Connector"
        description="Product catalogue"
        urlBase="/connectors"
      />
    ),
  },
};

/**
 * `Action` is a marker: the header collects them into a dropdown and renders
 * anything else inline. Without `menuLabel` the trigger is icon-only, which is
 * why it carries an `aria-label`.
 */
export const WithActions: Story = {
  args: {
    children: (
      <>
        <StickyPageHeader.Title
          icon={IconDatabase}
          feature="Connector"
          description="Product catalogue"
        />
        <StickyPageHeader.Actions>
          <StickyPageHeader.Action label="Export" icon={IconDownload} onClick={() => {}} />
          <StickyPageHeader.Action label="Delete" icon={IconTrash} onClick={() => {}} />
        </StickyPageHeader.Actions>
      </>
    ),
  },
};

export const WithALabelledMenu: Story = {
  args: {
    children: (
      <>
        <StickyPageHeader.Title
          icon={IconDatabase}
          feature="Connector"
          description="Product catalogue"
        />
        <StickyPageHeader.Actions menuLabel="Actions">
          <StickyPageHeader.Action label="Export" icon={IconDownload} onClick={() => {}} />
        </StickyPageHeader.Actions>
      </>
    ),
  },
};
