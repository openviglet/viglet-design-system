import type { Meta, StoryObj } from "@storybook/react-vite";

import { BentoPanel } from "./bento-panel";

/**
 * The frosted box with no heading. Its own doc comment says it exists because
 * every consumer that needed one hand-rolled `bento-glass rounded-2xl border` at
 * the call site — which is the thing the catalogue is supposed to prevent, so
 * the panel belongs in it (VDS116).
 *
 * `contentClassName` carries no padding of its own on purpose: a table wants
 * `p-0` so its rows reach the edge, a toolbar wants `py-2 px-4`. Both are below.
 */
const meta = {
  title: "Bento/BentoPanel",
  component: BentoPanel,
  tags: ["autodocs"],
  args: {
    className: "w-[420px]",
    contentClassName: "p-6",
    children: "A frosted box with arbitrary content in it.",
  },
} satisfies Meta<typeof BentoPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsAToolbar: Story = {
  args: {
    contentClassName: "flex items-center gap-3 px-4 py-2",
    children: (
      <>
        <span className="text-sm font-medium">12 selected</span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-muted-foreground">Ready to publish</span>
      </>
    ),
  },
};

export const AsAListing: Story = {
  args: {
    contentClassName: "p-0",
    children: (
      <ul className="divide-y divide-border/50 text-sm">
        {["Language models", "Indexing", "Connectors"].map((row) => (
          <li key={row} className="px-4 py-3">
            {row}
          </li>
        ))}
      </ul>
    ),
  },
};
