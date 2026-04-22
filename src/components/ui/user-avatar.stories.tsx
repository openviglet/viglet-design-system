import type { Meta, StoryObj } from "@storybook/react-vite";

import { UserAvatar } from "./user-avatar";

const meta = {
  title: "UI/UserAvatar",
  component: UserAvatar,
  tags: ["autodocs"],
  args: {
    givenName: "Alexandre",
    familyName: "Oliveira",
  },
} satisfies Meta<typeof UserAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    givenName: "Shadcn",
    familyName: "User",
    src: "https://github.com/shadcn.png",
    alt: "shadcn",
  },
};

export const FallbackInitials: Story = {
  args: {
    givenName: "Alexandre",
    familyName: "da Silva Oliveira",
  },
};

export const SingleName: Story = {
  args: {
    givenName: undefined,
    familyName: undefined,
    name: "Ada Lovelace",
  },
};

export const NoName: Story = {
  args: {
    givenName: undefined,
    familyName: undefined,
    name: undefined,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <UserAvatar givenName="Ada" familyName="Lovelace" className="size-6" />
      <UserAvatar givenName="Ada" familyName="Lovelace" />
      <UserAvatar givenName="Ada" familyName="Lovelace" className="size-12" />
      <UserAvatar givenName="Ada" familyName="Lovelace" className="size-16 text-base" />
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex -space-x-2">
      <UserAvatar
        givenName="Shadcn"
        familyName="User"
        src="https://github.com/shadcn.png"
        className="ring-2 ring-background"
      />
      <UserAvatar givenName="Ada" familyName="Lovelace" className="ring-2 ring-background" />
      <UserAvatar givenName="Alan" familyName="Turing" className="ring-2 ring-background" />
      <UserAvatar givenName="Grace" familyName="Hopper" className="ring-2 ring-background" />
    </div>
  ),
};
