import type { Meta, StoryObj } from "@storybook/react-vite";

import { BadgeLocale } from "./badge-locale";

const meta = {
  title: "App/BadgeLocale",
  component: BadgeLocale,
  tags: ["autodocs"],
  args: {
    locale: "en_US",
  },
} satisfies Meta<typeof BadgeLocale>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};
export const Portuguese: Story = { args: { locale: "pt_BR" } };
export const Spanish: Story = { args: { locale: "es_ES" } };
export const Japanese: Story = { args: { locale: "ja_JP" } };

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {["en_US", "pt_BR", "es_ES", "fr_FR", "de_DE", "ja_JP", "zh_CN", "it_IT", "nl_NL"].map(
        (locale) => (
          <BadgeLocale key={locale} locale={locale} />
        ),
      )}
    </div>
  ),
};
