import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconSettings } from "@tabler/icons-react";

import { DropdownMenuItem } from "./dropdown-menu";
import { UserMenu, type UserMenuUser } from "./user-menu";

const sampleUser: UserMenuUser = {
  username: "alexandre.oliveira",
  firstName: "Alexandre",
  lastName: "Oliveira",
  email: "alexandre.oliveira@vilt-group.com",
};

const meta = {
  title: "UI/UserMenu",
  component: UserMenu,
  tags: ["autodocs"],
  argTypes: {
    align: {
      control: "select",
      options: ["start", "center", "end"],
    },
  },
  args: {
    user: sampleUser,
    onAccount: () => {},
    onSignOut: () => {},
    align: "end",
  },
  render: (args) => (
    <div className="flex min-h-[280px] w-[320px] items-start justify-end p-4">
      <UserMenu {...args} />
    </div>
  ),
} satisfies Meta<typeof UserMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAvatarImage: Story = {
  args: {
    user: {
      ...sampleUser,
      avatarUrl: "https://github.com/shadcn.png",
    },
  },
};

export const UsernameOnly: Story = {
  args: {
    user: {
      username: "jdoe",
    },
  },
};

export const WithExtraItems: Story = {
  args: {
    extraItems: (
      <DropdownMenuItem className="cursor-pointer">
        <IconSettings />
        Settings
      </DropdownMenuItem>
    ),
  },
};

export const NoAccountHandler: Story = {
  args: {
    onAccount: undefined,
  },
};

export const NoSignOutHandler: Story = {
  args: {
    onSignOut: undefined,
  },
};
