import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconArchive, IconFileText, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { BentoDataTable, type BentoDataTableColumn, type BentoDataTableLayout } from "./bento-data-table";

/**
 * The table a console lists thousands of things in. Five thousand rows here, and
 * only the ones on screen are mounted.
 *
 * Keyboard: Tab into the table, then the arrows move between rows, Shift with an
 * arrow extends a selection, Space toggles one, Ctrl or Cmd with A selects all,
 * Escape clears, and Enter opens the row. Tab from a row reaches its actions
 * menu. Every row, column and action here is the story's: the table holds no
 * data and no product vocabulary.
 */
const meta = {
  title: "Bento/DataTable",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface Post {
  id: string;
  title: string;
  author: string;
  status: "Draft" | "Published";
  updated: Date;
}

const AUTHORS = ["Ana Silva", "Bruno Costa", "Carla Dias", "Diego Rocha"];

const POSTS: Post[] = Array.from({ length: 5_000 }, (_, i) => ({
  id: `post-${i}`,
  title: `Quarterly update ${i + 1}`,
  author: AUTHORS[i % AUTHORS.length],
  status: i % 3 === 0 ? "Draft" : "Published",
  updated: new Date(Date.UTC(2026, 0, 1) + i * 3_600_000),
}));

const COLUMNS: BentoDataTableColumn<Post>[] = [
  { id: "title", header: "Title", cell: (p) => p.title, sortValue: (p) => p.title, width: "minmax(14rem, 2fr)", hideable: false },
  { id: "author", header: "Author", cell: (p) => p.author, sortValue: (p) => p.author },
  { id: "status", header: "Status", cell: (p) => p.status, sortValue: (p) => p.status, width: "8rem" },
  {
    id: "updated",
    header: "Updated",
    cell: (p) => p.updated.toISOString().slice(0, 10),
    sortValue: (p) => p.updated,
    width: "9rem",
  },
];

function PostsTable() {
  const [layout, setLayout] = useState<BentoDataTableLayout>({ hidden: [] });
  const [last, setLast] = useState("Nothing yet.");

  return (
    <div className="flex flex-col gap-3">
      <BentoDataTable<Post>
        rows={POSTS}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.title}
        columns={COLUMNS}
        label="Posts"
        layout={layout}
        onLayoutChange={setLayout}
        onRowOpen={(p) => setLast(`Opened ${p.title}.`)}
        rowActions={[
          { id: "open", label: "Open", icon: IconFileText, onSelect: ([p]) => setLast(`Opened ${p.title}.`) },
          { id: "trash", label: "Move to trash", icon: IconTrash, tone: "destructive", onSelect: ([p]) => setLast(`Trashed ${p.title}.`) },
        ]}
        selectionActions={[
          { id: "archive", label: "Archive", icon: IconArchive, onSelect: (rows) => setLast(`Archived ${rows.length}.`) },
          { id: "trash", label: "Move to trash", icon: IconTrash, tone: "destructive", onSelect: (rows) => setLast(`Trashed ${rows.length}.`) },
        ]}
      />
      <p className="text-sm text-muted-foreground">{last}</p>
    </div>
  );
}

export const FiveThousandRows: Story = {
  render: () => <PostsTable />,
};

export const Empty: Story = {
  render: () => (
    <BentoDataTable<Post>
      rows={[]}
      getRowId={(p) => p.id}
      columns={COLUMNS}
      label="Posts"
      empty="No posts in this folder yet."
    />
  ),
};
