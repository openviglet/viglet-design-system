import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import type { VigLocale } from "@/models/locale";
import { LanguageSelect } from "./language-select";

const locales: VigLocale[] = [
  { initials: "en_US", en: "English (US)", pt: "Inglês (EUA)" },
  { initials: "pt_BR", en: "Portuguese (Brazil)", pt: "Português (Brasil)" },
  { initials: "es_ES", en: "Spanish (Spain)", pt: "Espanhol (Espanha)" },
  { initials: "fr_FR", en: "French (France)", pt: "Francês (França)" },
  { initials: "de_DE", en: "German (Germany)", pt: "Alemão (Alemanha)" },
  { initials: "ja_JP", en: "Japanese", pt: "Japonês" },
];

// The select is controlled, so the story owns the value. Hooks live in a named
// component rather than in `render` so the rules-of-hooks lint still applies.
function ControlledSelect(args: React.ComponentProps<typeof LanguageSelect>) {
  const [value, setValue] = useState(args.value);
  return (
    <div className="w-72">
      <LanguageSelect
        {...args}
        value={value}
        onValueChange={(v) => {
          setValue(v);
          args.onValueChange(v);
        }}
      />
    </div>
  );
}

const meta = {
  title: "App/LanguageSelect",
  component: LanguageSelect,
  tags: ["autodocs"],
  args: {
    locales,
    onValueChange: () => {},
  },
  render: (args) => <ControlledSelect {...args} />,
} satisfies Meta<typeof LanguageSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Selected: Story = {
  args: { value: "pt_BR" },
};

export const WithExtraLocales: Story = {
  args: {
    value: "xx_XX",
    extraLocaleValues: ["xx_XX", "it_IT"],
  },
};
