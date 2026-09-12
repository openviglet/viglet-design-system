import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconTrash } from "@tabler/icons-react";
import { useState } from "react";

import { BentoDataTable } from "./bento-data-table";
import { BentoFilterBar, EMPTY_FILTERS, type BentoFilterFacet, type BentoFilterValue } from "./bento-filter-bar";

/**
 * The query row, drawn once. The bar holds no state: the story keeps the value,
 * filters its own rows with it, and passes the same value to the table as its
 * selection scope, so a selection clears when the filters change the rows.
 */
const meta = {
  title: "Bento/FilterBar",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

interface Post {
  id: string;
  title: string;
  type: "article" | "page";
  state: "draft" | "published";
  updated: string;
}

const POSTS: Post[] = Array.from({ length: 400 }, (_, i) => ({
  id: `post-${i}`,
  title: `${i % 2 ? "Annual report" : "Team update"} ${i + 1}`,
  type: i % 3 === 0 ? "page" : "article",
  state: i % 4 === 0 ? "draft" : "published",
  updated: new Date(Date.UTC(2026, 7, 1) + i * 86_400_000 / 8).toISOString().slice(0, 10),
}));

const FACETS: BentoFilterFacet[] = [
  {
    id: "type",
    kind: "choice",
    label: "Type",
    options: [
      { value: "article", label: "Article" },
      { value: "page", label: "Page" },
    ],
  },
  {
    id: "state",
    kind: "choice",
    label: "State",
    multiple: true,
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  },
  { id: "updated", kind: "date", label: "Updated" },
];

function matches(post: Post, filters: BentoFilterValue) {
  const { query, facets } = filters;
  if (query && !post.title.toLowerCase().includes(query.toLowerCase())) return false;
  const type = facets.type as readonly string[] | undefined;
  if (type?.length && !type.includes(post.type)) return false;
  const state = facets.state as readonly string[] | undefined;
  if (state?.length && !state.includes(post.state)) return false;
  const updated = facets.updated as { from?: string; to?: string } | undefined;
  if (updated?.from && post.updated < updated.from) return false;
  if (updated?.to && post.updated > updated.to) return false;
  return true;
}

function FilteredPosts() {
  const [filters, setFilters] = useState<BentoFilterValue>(EMPTY_FILTERS);
  const rows = POSTS.filter((post) => matches(post, filters));

  return (
    <div className="flex flex-col gap-3">
      <BentoFilterBar value={filters} onChange={setFilters} facets={FACETS} queryLabel="Search posts" />
      <BentoDataTable<Post>
        rows={rows}
        getRowId={(p) => p.id}
        getRowLabel={(p) => p.title}
        label="Posts"
        height={360}
        selectionScope={JSON.stringify(filters)}
        columns={[
          { id: "title", header: "Title", cell: (p) => p.title, sortValue: (p) => p.title, hideable: false },
          { id: "type", header: "Type", cell: (p) => p.type, sortValue: (p) => p.type, width: "8rem" },
          { id: "state", header: "State", cell: (p) => p.state, sortValue: (p) => p.state, width: "8rem" },
          { id: "updated", header: "Updated", cell: (p) => p.updated, sortValue: (p) => p.updated, width: "8rem" },
        ]}
        selectionActions={[{ id: "trash", label: "Move to trash", icon: IconTrash, onSelect: () => {} }]}
      />
    </div>
  );
}

export const WithATable: Story = {
  render: () => <FilteredPosts />,
};

export const WithFiltersApplied: Story = {
  render: () => (
    <BentoFilterBar
      value={{ query: "report", facets: { type: ["article"], state: ["draft"], updated: { from: "2026-08-01", to: "2026-08-31" } } }}
      onChange={() => {}}
      facets={FACETS}
    />
  ),
};
