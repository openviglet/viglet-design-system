import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconPencil, IconTrash } from "@tabler/icons-react";

import type { VigGridItem } from "@/models";
import { GridList } from "./grid.list";

/**
 * The console list page (VDS116 — it had no story, so the axe pass never reached
 * a page every console renders).
 *
 * The compound children are markers rather than rendered output: `NewButton`,
 * `Action` and `ItemAction` declare what the grid should offer, and the grid
 * decides where each one goes.
 *
 * Console-era and `@deprecated`. `BentoListPage` is the bento equivalent, and
 * `BentoTileGrid` is the mosaic alone if the page has its own chrome.
 */

const items: VigGridItem[] = [
  {
    id: "1",
    name: "Product catalogue",
    description: "Everything the storefront sells",
    url: "/connectors/catalogue",
  },
  {
    id: "2",
    name: "Help centre",
    description: "Articles, guides and release notes",
    url: "/connectors/help",
  },
  {
    id: "3",
    name: "Internal wiki",
    description: "Pages behind the single sign-on",
    url: "/connectors/wiki",
  },
];

const meta = {
  title: "Console/GridList",
  component: GridList,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { gridItemList: items },
} satisfies Meta<typeof GridList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { gridItemList: [] },
};

export const WithActions: Story = {
  args: {
    children: (
      <>
        <GridList.NewButton to="/connectors/new" label="Add a connector" />
        <GridList.ItemAction
          icon={<IconPencil size={16} />}
          label="Edit"
          onClick={() => {}}
        />
        <GridList.ItemAction
          icon={<IconTrash size={16} />}
          label="Delete"
          position="right"
          onClick={() => {}}
        />
      </>
    ),
  },
};
