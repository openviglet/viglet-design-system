import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2 } from "@tabler/icons-react";
import { useState } from "react";

import { BentoEntityShell } from "./bento-entity-shell";
import { BentoFormSection } from "./bento-form-section";
import { BentoHeroIconPicker } from "./bento-hero-icon-picker";
import { BentoInlineEdit } from "./bento-inline-edit";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Model {
  id?: string;
  title?: string;
  description?: string;
  icon?: string | null;
  enabled?: number;
}

/**
 * The detail scaffold. A page is one call with a render prop: the hero owns the
 * identity — title, description, icon, status — and the form owns its fields.
 * Nothing about the shell's mechanics lives in the page.
 */
const meta = {
  title: "Bento/BentoEntityShell",
  component: BentoEntityShell,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BentoEntityShell>;

export default meta;
/**
 * Not `StoryObj<typeof meta>`. `BentoEntityShell` is generic over the entity and
 * every story goes through the `shell()` helper below, whose props are checked
 * as JSX. The bound type would only demand an `args` nothing reads (VDS119).
 */
type Story = StoryObj;

const atRest = { "--bento-fade": 0 } as React.CSSProperties;

const entity: Model = {
  id: "1",
  title: "Claude",
  description: "Anthropic's model family",
  icon: null,
  enabled: 1,
};

function shell(props: Partial<React.ComponentProps<typeof BentoEntityShell<Model>>>) {
  return (
    <div className="p-6" style={atRest}>
      <BentoEntityShell<Model>
        entity={entity}
        isNew={false}
        headlineFallback="Untitled model"
        eyebrow="All models"
        listRoute="/models"
        icon={IconCpu2}
        tone="blue"
        formId="model-form"
        feature="model"
        hasStatus
        onUpdate={async () => undefined}
        onDelete={async () => true}
        {...props}
      >
        {() => (
          <form id="model-form" className="mt-4">
            <BentoFormSection tone="violet" title="Connection" icon={IconCpu2}>
              <div className="grid gap-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input id="endpoint" placeholder="https://" />
              </div>
            </BentoFormSection>
          </form>
        )}
      </BentoEntityShell>
    </div>
  );
}

export const Existing: Story = { render: () => shell({}) };

export const NewEntity: Story = {
  render: () => shell({ entity: {}, isNew: true }),
};

/** A shared resource this reader may look at but not change. */
export const ReadOnly: Story = {
  render: () =>
    shell({
      readOnly: true,
      badge: <span className="rounded-full border px-2 py-0.5 text-xs">GLOBAL</span>,
      notice: (
        <div className="rounded-xl border p-3 text-sm text-muted-foreground">
          This pool is shared. Ask a platform admin to change it.
        </div>
      ),
    }),
};

/** Identity saves as you type, so a Save button would sit permanently inert. */
export const AutosaveOnly: Story = { render: () => shell({ autosaveOnly: true }) };

export const InlineEdit: Story = {
  render: function InlineEditStory() {
    const [value, setValue] = useState("Click to rename");
    return (
      <div className="p-6">
        <BentoInlineEdit value={value} onSave={setValue} ariaLabel="Title" />
      </div>
    );
  },
};

export const IconPicker: Story = {
  render: function IconPickerStory() {
    const [icon, setIcon] = useState<string | null>("tabler:robot");
    return (
      <div className="flex items-center gap-6 p-6">
        <BentoHeroIconPicker
          value={icon}
          onChange={setIcon}
          onClear={() => setIcon(null)}
          defaultIcon={IconCpu2}
          tone="violet"
        />
        <BentoHeroIconPicker value={icon} onChange={() => {}} defaultIcon={IconCpu2} tone="violet" readOnly />
      </div>
    );
  },
};
