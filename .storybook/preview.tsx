import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { vigDesignSystemTranslations } from "../src/i18n";
import "../src/styles/index.css";

if (!i18n.isInitialized) {
  const resources: Record<string, { translation: Record<string, unknown> }> = {};
  for (const [lang, dict] of Object.entries(vigDesignSystemTranslations)) {
    resources[lang] = { translation: dict };
  }
  void i18n.use(initReactI18next).init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: { disable: true },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
  },
  decorators: [
    withThemeByClassName({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
    }),
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
};

export default preview;
