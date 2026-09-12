import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { BentoDiff, type BentoDiffField } from "./bento-diff";
import { BentoVersionRail, type BentoVersion } from "./bento-version-rail";

/**
 * One comparison for revision history, an agent's change under review, and a
 * translation against its source. Pick two versions on the rail; the diff shows
 * what changed between them, field by field. The first version is the page being
 * created, which renders as additions rather than as an empty panel.
 */
const meta = {
  title: "Bento/Diff",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const FIELDS: BentoDiffField[] = [
  { id: "title", label: "Title" },
  { id: "summary", label: "Summary" },
  { id: "body", label: "Body", kind: "rich" },
  { id: "order", label: "Order", kind: "value" },
];

const CONTENT: Record<string, Record<string, unknown> | null> = {
  v0: null,
  v1: {
    title: "Quarterly results",
    summary: "Revenue in line with the previous quarter.",
    body: "<h2>Highlights</h2><p>Revenue was flat.</p><p>Costs fell.</p>",
    order: 3,
  },
  v2: {
    title: "Quarterly results",
    summary: "Revenue in line with the previous quarter, and margin up.",
    body: "<h2>Highlights</h2><p>Revenue was flat.</p><p>Operating margin rose <strong>2.4</strong> points.</p><p>Costs fell.</p>",
    order: 3,
  },
  v3: {
    title: "Third quarter results",
    summary: "Revenue in line with the previous quarter, and margin up.",
    body: "<h2>Highlights</h2><p>Revenue was flat.</p><p>Operating margin rose 2.4 points.</p><p>Costs fell sharply.</p>",
    order: 1,
  },
};

const VERSIONS: BentoVersion[] = [
  { id: "v3", author: "Drafting agent", actor: "agent", at: "2026-09-12T14:02:00Z", summary: "Tightened the title and the body" },
  { id: "v2", author: "Ana Silva", actor: "human", at: "2026-09-11T09:30:00Z", summary: "Added the margin" },
  { id: "v1", author: "Ana Silva", actor: "human", at: "2026-09-10T16:45:00Z", summary: "First draft" },
  { id: "v0", author: "Ana Silva", actor: "human", at: "2026-09-10T16:40:00Z", summary: "Created" },
];

function History() {
  const [selected, setSelected] = useState<string[]>(["v2", "v3"]);
  const [older, newer] = selected.length === 2 ? selected : [undefined, selected[0]];
  return (
    <div className="grid gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
      <BentoVersionRail versions={VERSIONS} selected={selected} onSelect={setSelected} label="Revisions" />
      <BentoDiff
        before={older === undefined ? null : (CONTENT[older] ?? null)}
        after={newer === undefined ? null : (CONTENT[newer] ?? null)}
        fields={FIELDS}
      />
    </div>
  );
}

export const RevisionHistory: Story = {
  render: () => <History />,
};

export const CreatedPage: Story = {
  render: () => <BentoDiff before={null} after={CONTENT.v1} fields={FIELDS} />,
};
