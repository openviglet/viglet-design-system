import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2 } from "@tabler/icons-react";

import { BentoEntityTile } from "./bento-entity-tile";
import { BentoListPage, BentoTileGrid } from "./bento-list-page";

interface Model {
  id: string;
  name: string;
  note: string;
  enabled: number;
}

const models: Model[] = [
  { id: "a", name: "Claude", note: "Anthropic", enabled: 1 },
  { id: "b", name: "GPT", note: "OpenAI", enabled: 1 },
  { id: "c", name: "Llama", note: "Meta", enabled: 0 },
  { id: "d", name: "Mistral", note: "Mistral AI", enabled: 1 },
  { id: "e", name: "Gemma", note: "Google", enabled: 0 },
];

/**
 * A whole list screen: one call plus a `renderTile`. The mosaic sizes the first
 * item large and widens the rest, so two consoles' grids line up without either
 * of them deciding anything.
 */
const meta = {
  title: "Bento/BentoListPage",
  component: BentoListPage,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BentoListPage>;

export default meta;
/**
 * Not `StoryObj<typeof meta>`. `BentoListPage` is generic over the entity, and
 * these stories build a real one through `common` and `render`. The bound type
 * would ask for an `args` on the default instantiation that no story uses; the
 * props each story actually passes are checked in the JSX (VDS119).
 */
type Story = StoryObj;

const common = {
  tryAgainUrl: "/models",
  heroIcon: IconCpu2,
  title: "Language models",
  subtitle: "Every model this install can reach",
  newRoute: "/models/new",
  newLabel: "New model",
  newSubtitle: "Connect a provider",
  itemKey: (m: Model) => m.id,
  renderTile: (m: Model, emphasis: "SMALL" | "MEDIUM" | "LARGE") => (
    <BentoEntityTile
      to={`/models/${m.id}`}
      emphasis={emphasis}
      defaultIcon={IconCpu2}
      title={m.name}
      description={m.note}
      hasStatus
      enabled={m.enabled}
    />
  ),
  emptyTitle: "No models yet",
  emptyDescription: "Connect a provider to get started.",
};

export const Populated: Story = {
  render: () => (
    <div className="p-6">
      <BentoListPage<Model> {...common} items={models} />
    </div>
  ),
};

/** The same screen with nothing in it — the state a console meets on day one. */
export const Empty: Story = {
  render: () => (
    <div className="p-6">
      <BentoListPage<Model> {...common} items={[]} />
    </div>
  ),
};

/** Still loading: the list gate holds the page rather than flashing an empty grid. */
export const Loading: Story = {
  render: () => (
    <div className="p-6">
      <BentoListPage<Model> {...common} items={undefined} />
    </div>
  ),
};

/**
 * With a layout supplied, the mosaic gains a customise affordance. The product
 * owns where a layout is stored; here it is remembered in memory only.
 */
export const Customisable: Story = {
  render: () => (
    <div className="p-6">
      <BentoListPage<Model>
        {...common}
        items={models}
        listId="models"
        layout={{
          data: { listId: "models", source: "DEFAULT", canEditGlobal: true, entries: [] },
          onSave: () => {},
          onSaveGlobal: () => {},
        }}
      />
    </div>
  ),
};

/**
 * The mosaic on its own, for a page that supplies its own hero and chrome.
 *
 * VDS119 — this story used to pass `resolved` and `chip`, which belong to the
 * internal `StaticGrid` and are not this component's props, and no `items`,
 * `itemKey` or empty-state text, which are. It rendered whatever that made of
 * it and nothing read the file.
 */
export const TileGrid: Story = {
  render: () => (
    <div className="p-6">
      <BentoTileGrid<Model>
        items={models}
        tryAgainUrl={common.tryAgainUrl}
        itemKey={common.itemKey}
        // This one takes no emphasis — the grid without the hero renders every
        // tile at one size, so the story picks it.
        renderTile={(m) => common.renderTile(m, "MEDIUM")}
        hideNew
        emptyTitle={common.emptyTitle}
        emptyDescription={common.emptyDescription}
      />
    </div>
  ),
};
