import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// English
import enCommon from "./locales/en/common.json";
import enDialog from "./locales/en/dialog.json";
import enForms from "./locales/en/forms.json";
import enNav from "./locales/en/nav.json";
import enSidebar from "./locales/en/sidebar.json";
import enTheme from "./locales/en/theme.json";

// Portuguese
import ptCommon from "./locales/pt/common.json";
import ptDialog from "./locales/pt/dialog.json";
import ptForms from "./locales/pt/forms.json";
import ptNav from "./locales/pt/nav.json";
import ptSidebar from "./locales/pt/sidebar.json";
import ptTheme from "./locales/pt/theme.json";

export const vigDesignSystemTranslations = {
  en: {
    ...enCommon,
    ...enDialog,
    ...enForms,
    ...enNav,
    ...enSidebar,
    ...enTheme,
  },
  pt: {
    ...ptCommon,
    ...ptDialog,
    ...ptForms,
    ...ptNav,
    ...ptSidebar,
    ...ptTheme,
  },
};

/**
 * Initialize i18n with design system translations.
 * Call this in your app's entry point, optionally merging with app-specific translations.
 */
export function initVigI18n(appTranslations?: Record<string, Record<string, unknown>>) {
  const mergedResources: Record<string, { translation: Record<string, unknown> }> = {};

  for (const lang of ["en", "pt"]) {
    const dsTranslations = vigDesignSystemTranslations[lang as keyof typeof vigDesignSystemTranslations] || {};
    const appLangTranslations = appTranslations?.[lang] || {};

    mergedResources[lang] = {
      translation: {
        ...dsTranslations,
        ...appLangTranslations,
      },
    };
  }

  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: mergedResources,
      fallbackLng: "en",
      detection: {
        order: ["localStorage", "navigator", "htmlTag", "cookie"],
        caches: ["localStorage"],
      },
      interpolation: {
        escapeValue: false,
      },
    });

  return i18n;
}

/**
 * Register design system translations into an existing i18n instance.
 * Useful when the host app already has i18n initialized.
 */
export function registerVigTranslations(i18nInstance: typeof i18n) {
  for (const [lang, translations] of Object.entries(vigDesignSystemTranslations)) {
    for (const [namespace, values] of Object.entries(translations)) {
      if (typeof values === "object" && values !== null) {
        const existing = i18nInstance.getResourceBundle(lang, "translation") || {};
        if (!existing[namespace]) {
          i18nInstance.addResourceBundle(lang, "translation", { [namespace]: values }, true, true);
        }
      }
    }
  }
}

export { i18n };
