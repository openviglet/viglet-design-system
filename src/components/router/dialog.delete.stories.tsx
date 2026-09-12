import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { DialogDelete } from "./dialog.delete";

/**
 * The console delete confirmation (VDS116 — it had no story, so the axe pass
 * never reached a dialog every product opens).
 *
 * Console-era and `@deprecated`, like the rest of this block: still exported and
 * still supported until the consoles cut over.
 */
const meta = {
  title: "Console/DialogDelete",
  component: DialogDelete,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DialogDelete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function Confirming() {
    const [open, setOpen] = useState(true);
    return (
      <DialogDelete
        feature="Connector"
        name="Product catalogue"
        open={open}
        setOpen={setOpen}
        onDelete={() => setOpen(false)}
      />
    );
  },
};

/**
 * The blocked path: something depends on this entity, so the dialog lists what
 * and offers no confirmation. Each dependant is a `BadgeColorful`, which renders
 * a name the product's own content supplied.
 */
export const BlockedByDependants: Story = {
  render: function Blocked() {
    const [open, setOpen] = useState(true);
    return (
      <DialogDelete
        feature="Connector"
        name="Product catalogue"
        open={open}
        setOpen={setOpen}
        onDelete={() => setOpen(false)}
        blockedBy={[
          { id: "1", name: "Storefront", href: "/sites/storefront", language: "en_US" },
          { id: "2", name: "Loja", href: "/sites/loja", language: "pt_BR" },
        ]}
      />
    );
  },
};
