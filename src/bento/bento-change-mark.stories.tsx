import type { Meta, StoryObj } from "@storybook/react-vite";

import { BentoChangeMark, type BentoChangeState } from "./bento-change-mark";

/**
 * The mark `BentoDiff` draws beside each field, for a list of what changed: a
 * file an agent touched, a page in a review queue. `compact` draws git's letter
 * where a row is narrow, with the word as its name and tooltip.
 */
const meta = {
  title: "Bento/Change mark",
  component: BentoChangeMark,
  parameters: { layout: "padded" },
  args: { state: "changed" },
} satisfies Meta<typeof BentoChangeMark>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: BentoChangeState[] = ["added", "changed", "removed", "unchanged"];

export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {STATES.map((state) => (
        <BentoChangeMark key={state} state={state} />
      ))}
    </div>
  ),
};

/** Beside each item of a list, as a source-control view marks the files it touched. */
export const CompactInAList: Story = {
  render: () => (
    <ul className="m-0 flex w-64 list-none flex-col gap-1 p-0 font-mono text-xs">
      {(
        [
          ["src/app.ts", "changed"],
          ["src/steps.ts", "added"],
          ["src/legacy.ts", "removed"],
        ] as const
      ).map(([file, state]) => (
        <li key={file} className="flex items-center justify-between gap-2">
          <span className={state === "removed" ? "line-through" : undefined}>{file}</span>
          <BentoChangeMark state={state} compact />
        </li>
      ))}
    </ul>
  ),
};
