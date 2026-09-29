import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2, IconDatabase, IconTrash } from "@tabler/icons-react";

import { BentoActionsMenu } from "./bento-actions-menu";
import { BentoCountTile } from "./bento-count-tile";
import { BentoEmptyState } from "./bento-empty-state";
import { BentoFormSection } from "./bento-form-section";
import { BentoSection } from "./bento-section";
import { BENTO_RECORD_STATES, BentoStatusMarker } from "./bento-status-marker";
import { BENTO_TONES } from "./bento-tones";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The small pieces a bento page is assembled from. Grouped in one entry because
 * each is a handful of markup and reading them together is how their shared
 * vocabulary — the card surface, the chip that names one thing, the neutral
 * well where nothing single is named, the record states — becomes visible.
 */
const meta = {
  title: "Bento/Leaves",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const grid = "bento-grid grid w-full max-w-4xl auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:grid-cols-4";

export const CountTiles: Story = {
  render: () => (
    <div className={grid}>
      {BENTO_TONES.map((tone) => (
        <BentoCountTile
          key={tone}
          tone={tone}
          label={tone}
          count={1234}
          span="col-span-2"
          icon={IconDatabase}
          to="/documents"
        />
      ))}
    </div>
  ),
};

export const Section: Story = {
  render: () => (
    <div className="w-full max-w-3xl">
      <BentoSection title="Indexing" description="Crawlers and schedules">
        <p className="text-sm text-muted-foreground">Whatever the section holds.</p>
      </BentoSection>
    </div>
  ),
};

export const FormSections: Story = {
  render: () => (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {["Connection", "Credentials", "Schedule"].map((title) => (
        <BentoFormSection key={title} title={title} icon={IconCpu2}>
          <div className="grid gap-2">
            <Label htmlFor={`endpoint-${title}`}>Endpoint</Label>
            <Input id={`endpoint-${title}`} placeholder="https://" />
          </div>
        </BentoFormSection>
      ))}
    </div>
  ),
};

export const EmptyStates: Story = {
  render: () => (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <BentoEmptyState
        title="No models yet"
        description="Add one to get started."
        action={<button type="button" className="text-sm underline">Add a model</button>}
      />
      <BentoEmptyState title="Nothing here" align="start" />
    </div>
  ),
};

export const StatusMarkers: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      {/* A record's state: the one colour a row or a list tile carries. */}
      {BENTO_RECORD_STATES.map((state) => (
        <BentoStatusMarker key={state} state={state} />
      ))}
      <BentoStatusMarker dirty />
      <BentoStatusMarker titleMissing />
      {/* Neither condition: renders nothing, which is the third state. */}
      <BentoStatusMarker />
    </div>
  ),
};

export const ActionsMenu: Story = {
  render: () => (
    <BentoActionsMenu
      actions={[
        { id: "item.duplicate", label: "Duplicate", icon: IconCpu2, onSelect: () => {} },
        { id: "item.delete", label: "Delete", icon: IconTrash, onSelect: () => {}, tone: "destructive" },
      ]}
    />
  ),
};
