import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2, IconShieldLock } from "@tabler/icons-react";

import { AdaptiveSectionCard } from "./bento-section-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The console's compound form markup — a `Header` child and a `Content` child —
 * rendered as frosted bento sections. It is what let a product migrate a heavy
 * form without forking its field logic, and what lets one stay written that way
 * now the migration is over.
 */
const meta = {
  title: "Bento/AdaptiveSectionCard",
  component: AdaptiveSectionCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdaptiveSectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

function SharedForm() {
  return (
    <>
      <AdaptiveSectionCard variant="violet">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Connection" description="Where to reach it" />
        <AdaptiveSectionCard.Content>
          <div className="grid gap-2">
            <Label htmlFor="endpoint">Endpoint</Label>
            <Input id="endpoint" placeholder="https://" />
          </div>
        </AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>
      <AdaptiveSectionCard variant="emerald">
        <AdaptiveSectionCard.Header icon={IconShieldLock} title="Credentials" description="How to authenticate" />
        <AdaptiveSectionCard.Content>
          <div className="grid gap-2">
            <Label htmlFor="token">API token</Label>
            <Input id="token" type="password" placeholder="••••••••" />
          </div>
        </AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <SharedForm />
    </div>
  ),
};

/** A section built some other way: no header to read, so the surface renders and the children stay. */
export const NoHeader: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <AdaptiveSectionCard>
        <div className="grid gap-2">
          <Label htmlFor="freeform">Written without the compound markup</Label>
          <Input id="freeform" placeholder="still on the frosted surface" />
        </div>
      </AdaptiveSectionCard>
    </div>
  ),
};
