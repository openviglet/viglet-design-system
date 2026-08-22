import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2, IconShieldLock } from "@tabler/icons-react";

import { AdaptiveSectionCard, SectionCardChromeProvider } from "./bento-section-chrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * One form, two chromes. The markup below is written once and rendered twice —
 * as the console's collapsible cards and as the frosted bento sections — which
 * is what lets a product migrate a heavy form behind a parallel route without
 * forking its field logic.
 */
const meta = {
  title: "Bento/AdaptiveSectionCard",
  component: AdaptiveSectionCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof AdaptiveSectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Written once, rendered in both stories below without a character changing. */
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

export const ConsoleChrome: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <SectionCardChromeProvider chrome="console">
        <SharedForm />
      </SectionCardChromeProvider>
    </div>
  ),
};

export const BentoChrome: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <SectionCardChromeProvider chrome="bento">
        <SharedForm />
      </SectionCardChromeProvider>
    </div>
  ),
};

/** No provider at all: the console card, so an existing form is unaffected. */
export const NoProvider: Story = {
  render: () => (
    <div className="flex max-w-2xl flex-col gap-4">
      <SharedForm />
    </div>
  ),
};
