import type { Meta, StoryObj } from "@storybook/react-vite";

import { StickySaveBar } from "./sticky-save-bar";

const meta = {
  title: "UI/StickySaveBar",
  component: StickySaveBar,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["gray", "blue", "orange", "green"],
    },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  args: {
    title: "Edit profile",
    variant: "gray",
  },
} satisfies Meta<typeof StickySaveBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[720px]">
      <StickySaveBar {...args} onCancel={() => {}} />
    </div>
  ),
};

export const WithBadges: Story = {
  render: (args) => (
    <div className="w-[720px]">
      <StickySaveBar
        {...args}
        badges={
          <>
            <StickySaveBar.Badge>Unsaved</StickySaveBar.Badge>
            <StickySaveBar.Badge>3 changes</StickySaveBar.Badge>
          </>
        }
        onCancel={() => {}}
      />
    </div>
  ),
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => (
    <div className="w-[720px]">
      <StickySaveBar {...args} onCancel={() => {}} />
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div className="w-[720px]">
      <StickySaveBar {...args} onCancel={() => {}} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[720px] flex-col gap-3">
      <StickySaveBar title="Gray" variant="gray" onCancel={() => {}} />
      <StickySaveBar title="Blue" variant="blue" onCancel={() => {}} />
      <StickySaveBar title="Orange" variant="orange" onCancel={() => {}} />
      <StickySaveBar title="Green" variant="green" onCancel={() => {}} />
    </div>
  ),
};

export const InsideScrollContainer: Story = {
  render: (args) => (
    <div className="h-[320px] w-[720px] overflow-y-auto rounded-lg border">
      <StickySaveBar
        {...args}
        badges={<StickySaveBar.Badge>Unsaved</StickySaveBar.Badge>}
        onCancel={() => {}}
      />
      <div className="space-y-3 p-4 text-sm text-muted-foreground">
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>
            Scroll content line {i + 1}. The save bar stays pinned to the top
            while you scroll this container.
          </p>
        ))}
      </div>
    </div>
  ),
};
