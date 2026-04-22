import type { Meta, StoryObj } from "@storybook/react-vite";

import { LanguageSwitcher } from "./language-switcher";

const meta = {
  title: "App/LanguageSwitcher",
  component: LanguageSwitcher,
  tags: ["autodocs"],
} satisfies Meta<typeof LanguageSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLanguages: Story = {
  args: {
    languages: [
      { code: "en", label: "English", flag: "🇺🇸" },
      { code: "pt", label: "Português", flag: "🇧🇷" },
      { code: "es", label: "Español", flag: "🇪🇸" },
      { code: "fr", label: "Français", flag: "🇫🇷" },
      { code: "ja", label: "日本語", flag: "🇯🇵" },
    ],
  },
};
