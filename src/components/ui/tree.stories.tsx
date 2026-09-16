import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import { Badge } from "./badge";
import { Tree, treeFromPaths } from "./tree";

const meta = {
  title: "UI/Tree",
  component: Tree,
  tags: ["autodocs"],
  argTypes: {
    compact: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    label: "Files",
    compact: true,
  },
} satisfies Meta<typeof Tree>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A working tree, the shape a console or a CMS draws its own content in. */
const FILES = [
  "src/components/ui/tree.tsx",
  "src/components/ui/button.tsx",
  "src/lib/utils.ts",
  "docs/ROADMAP.md",
  "README.md",
];

export const Default: Story = {
  args: {
    nodes: treeFromPaths(FILES),
    defaultExpanded: ["src", "src/components/ui"],
  },
};

/**
 * Nothing is open. Every folder is one press of the right arrow away, and the first row holds
 * the only tab stop — a tree is one stop whatever its depth.
 */
export const Closed: Story = {
  args: {
    nodes: treeFromPaths(FILES),
  },
};

/**
 * `compact` off, so a folder whose only child is a folder keeps its own row. Compare with the
 * default, where `src/components/ui` is one row: four levels deep is otherwise four rows of
 * indentation before the first name anybody came to read.
 */
export const EveryFolderItsOwnRow: Story = {
  args: {
    nodes: treeFromPaths(FILES),
    compact: false,
    defaultExpanded: ["src", "src/components", "src/components/ui"],
  },
};

/** What a row says after its name is the product's, through `renderAfter`. */
export const WithStateOnEachRow: Story = {
  args: {
    nodes: treeFromPaths(FILES),
    defaultExpanded: ["src", "src/components/ui"],
    renderAfter: (node) =>
      node.children === undefined || node.children.length === 0 ? (
        <Badge variant="secondary">edited</Badge>
      ) : null,
  },
};

/** Selection is the caller's state: this one keeps it and draws the current row. */
export const Selecting: Story = {
  args: { nodes: treeFromPaths(FILES), defaultExpanded: ["src", "src/components/ui"] },
  render: function Selecting(args) {
    const [selected, setSelected] = React.useState<string>();
    return <Tree {...args} selected={selected} onSelect={setSelected} />;
  },
};
