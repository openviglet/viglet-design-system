import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { IconPickerDialog } from "./icon-picker-dialog";

/**
 * Search Iconify and pick an icon (VDS116 — it had no story, so the axe pass
 * never reached a dialog a product opens).
 *
 * The stories below stub `fetch` rather than calling `api.iconify.design`: the
 * catalogue and the axe run should not depend on a third-party API being up, and
 * what is under test here is the dialog rather than the search.
 */

const SAMPLE = [
  "tabler:arrow-right",
  "lucide:sparkles",
  "mdi:database",
  "ph:cloud",
  "solar:settings-linear",
  "heroicons:bolt",
];

/** A stubbed Iconify, installed for the life of the story. */
function withStubbedSearch(render: () => React.ReactElement) {
  return function Stubbed() {
    const [restored] = useState(() => {
      const real = globalThis.fetch;
      globalThis.fetch = (async () =>
        new Response(JSON.stringify({ icons: SAMPLE }), {
          headers: { "content-type": "application/json" },
        })) as typeof fetch;
      return real;
    });
    void restored;
    return render();
  };
}

const meta = {
  title: "UI/IconPickerDialog",
  component: IconPickerDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof IconPickerDialog>;

export default meta;
/**
 * Not `StoryObj<typeof meta>`. The dialog is open/closed state, so each story
 * owns a `useState` and passes the pair itself; there is no `args` a control
 * panel could drive. The props each story passes are checked in the JSX (VDS119).
 */
type Story = StoryObj;

export const Default: Story = {
  render: withStubbedSearch(function Open() {
    const [open, setOpen] = useState(true);
    return (
      <IconPickerDialog open={open} onOpenChange={setOpen} onSelect={() => setOpen(false)} />
    );
  }),
};

export const WithASelectedIcon: Story = {
  render: withStubbedSearch(function Selected() {
    const [value, setValue] = useState<string | null>("tabler:arrow-right");
    const [open, setOpen] = useState(true);
    return (
      <IconPickerDialog
        open={open}
        onOpenChange={setOpen}
        value={value}
        onSelect={setValue}
        onClear={() => setValue(null)}
      />
    );
  }),
};

/**
 * The suggest pass. `suggestKeywords` is the product's own — the package
 * searches Iconify and knows nothing about how the keywords were arrived at,
 * which is what keeps one product's model out of every product's chrome.
 */
export const WithSuggestions: Story = {
  render: withStubbedSearch(function Suggesting() {
    const [open, setOpen] = useState(true);
    return (
      <IconPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={() => setOpen(false)}
        title="Language models"
        description="Every model this install can reach"
        suggestKeywords={async () => ["model", "brain", "chip"]}
      />
    );
  }),
};
