import type { Preview } from "@storybook/react-vite";
import { withThemeByClassName } from "@storybook/addon-themes";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import { vigDesignSystemTranslations } from "../src/i18n";
import "../src/styles/index.css";
// The brand faces are a separate import since VDS41 — 741KB of woff2 that a
// product opts into. The catalogue opts in, because a type specimen rendered in
// system-ui is not what the components look like.
import "../src/styles/fonts.css";
// The bento layer ships its own stylesheet on a separate subpath, so a consumer
// only carries it when it renders one. The catalogue renders both eras, so it
// takes both.
import "../src/bento/bento.css";

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
    // VDS6 — the accessibility baseline, as a gate rather than as advice. The
    // addon was a devDependency no job ran, and the rules it holds (an
    // aria-label on every icon-only control, aria-hidden on decorative glyphs
    // with an adjacent screen-reader span, ARIA values as string literals)
    // survived 118 pages because one team read one file. "error" makes a
    // violation in any story fail the run.
    a11y: { test: "error" },
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
