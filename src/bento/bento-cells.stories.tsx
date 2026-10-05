import type { Meta, StoryObj } from "@storybook/react-vite";

import { BentoChangeCell } from "./bento-change-cell";
import { BentoDataTable } from "./bento-data-table";
import { BentoIdentityCell } from "./bento-identity-cell";

/**
 * The two cells a list's columns share: `BentoIdentityCell` for who or what a row
 * is, and `BentoChangeCell` for when it last changed and who changed it. Both take
 * values and fetch nothing.
 */
const meta = {
  title: "Bento/List cells",
  component: BentoIdentityCell,
  parameters: { layout: "padded" },
  args: { name: "Viglet Docs", detail: "docs.viglet.org" },
} satisfies Meta<typeof BentoIdentityCell>;

export default meta;
type Story = StoryObj<typeof meta>;

const NOW = new Date("2026-10-05T12:00:00Z");

interface Site {
  id: string;
  name: string;
  host: string;
  changed: string;
  by: string;
  agent?: boolean;
}

const SITES: Site[] = [
  { id: "docs", name: "Viglet Docs", host: "docs.viglet.org", changed: "2026-10-05T10:40:00Z", by: "Ana Souza" },
  { id: "blog", name: "Engineering Blog", host: "blog.viglet.org", changed: "2026-10-03T09:00:00Z", by: "Publisher", agent: true },
  { id: "intranet", name: "Intranet", host: "intranet.example.com", changed: "2026-06-12T15:30:00Z", by: "Rui Lima" },
];

export const Identity: Story = {};

export const Change: Story = {
  render: () => (
    <div className="flex flex-col gap-4 text-sm">
      <BentoChangeCell at="2026-10-05T11:58:00Z" now={NOW} actor="Ana Souza" />
      <BentoChangeCell at="2026-10-03T09:00:00Z" now={NOW} actor="Publisher" agent />
      <BentoChangeCell at="2026-06-12T15:30:00Z" now={NOW} />
    </div>
  ),
};

/** Both, as the first and last columns of a table. */
export const InATable: Story = {
  render: () => (
    <BentoDataTable<Site>
      rows={SITES}
      getRowId={(s) => s.id}
      getRowLabel={(s) => s.name}
      label="Sites"
      rowHeight={56}
      height={240}
      columns={[
        {
          id: "name",
          header: "Name",
          cell: (s) => <BentoIdentityCell name={s.name} detail={s.host} />,
          sortValue: (s) => s.name,
          hideable: false,
        },
        {
          id: "changed",
          header: "Changed",
          width: "12rem",
          cell: (s) => <BentoChangeCell at={s.changed} now={NOW} actor={s.by} agent={s.agent} />,
          sortValue: (s) => s.changed,
        },
      ]}
    />
  ),
};
