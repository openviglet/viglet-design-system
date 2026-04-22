import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  IconBell,
  IconLock,
  IconPalette,
  IconSettings,
  IconUser,
} from "@tabler/icons-react";

import { SectionCard } from "./section-card";

const meta = {
  title: "UI/SectionCard",
  component: SectionCard,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["blue", "violet", "emerald", "amber", "rose", "cyan", "orange", "slate"],
    },
    defaultOpen: { control: "boolean" },
  },
  args: {
    variant: "blue",
    defaultOpen: true,
  },
} satisfies Meta<typeof SectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[520px]">
      <SectionCard {...args}>
        <SectionCard.Header
          icon={IconSettings}
          title="General settings"
          description="Workspace-wide preferences"
        />
        <SectionCard.Content>
          <p className="text-sm text-muted-foreground">
            Configure the default language, timezone and notification cadence
            for everyone in the workspace.
          </p>
        </SectionCard.Content>
      </SectionCard>
    </div>
  ),
};

export const StaticHeader: Story = {
  render: (args) => (
    <div className="w-[520px]">
      <SectionCard {...args}>
        <SectionCard.StaticHeader
          icon={IconUser}
          title="Profile"
          description="Non-collapsible section"
        />
        <SectionCard.Content>
          <p className="text-sm text-muted-foreground">
            This content stays visible and is not controlled by a toggle.
          </p>
        </SectionCard.Content>
      </SectionCard>
    </div>
  ),
};

export const ClosedByDefault: Story = {
  args: { defaultOpen: false },
  render: (args) => (
    <div className="w-[520px]">
      <SectionCard {...args}>
        <SectionCard.Header
          icon={IconLock}
          title="Security"
          description="Click to expand"
        />
        <SectionCard.Content>
          <p className="text-sm text-muted-foreground">
            Two-factor authentication, session timeouts and IP allowlists.
          </p>
        </SectionCard.Content>
      </SectionCard>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[520px] flex-col gap-3">
      <SectionCard variant="blue">
        <SectionCard.Header icon={IconSettings} title="Blue" description="Default accent" />
        <SectionCard.Content>Content</SectionCard.Content>
      </SectionCard>
      <SectionCard variant="violet">
        <SectionCard.Header icon={IconPalette} title="Violet" description="Purple accent" />
        <SectionCard.Content>Content</SectionCard.Content>
      </SectionCard>
      <SectionCard variant="emerald">
        <SectionCard.Header icon={IconBell} title="Emerald" description="Green accent" />
        <SectionCard.Content>Content</SectionCard.Content>
      </SectionCard>
      <SectionCard variant="amber">
        <SectionCard.Header icon={IconSettings} title="Amber" description="Orange accent" />
        <SectionCard.Content>Content</SectionCard.Content>
      </SectionCard>
      <SectionCard variant="rose">
        <SectionCard.Header icon={IconLock} title="Rose" description="Pink accent" />
        <SectionCard.Content>Content</SectionCard.Content>
      </SectionCard>
    </div>
  ),
};
