import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

// English
import enAssistant from "./locales/en/assistant.json";
import enBento from "./locales/en/bento.json";
import enCommon from "./locales/en/common.json";
import enDialog from "./locales/en/dialog.json";
import enForms from "./locales/en/forms.json";
import enLanguage from "./locales/en/language.json";
import enNav from "./locales/en/nav.json";
import enSidebar from "./locales/en/sidebar.json";
import enTheme from "./locales/en/theme.json";

// Portuguese
import ptAssistant from "./locales/pt/assistant.json";
import ptBento from "./locales/pt/bento.json";
import ptCommon from "./locales/pt/common.json";
import ptDialog from "./locales/pt/dialog.json";
import ptForms from "./locales/pt/forms.json";
import ptLanguage from "./locales/pt/language.json";
import ptNav from "./locales/pt/nav.json";
import ptSidebar from "./locales/pt/sidebar.json";
import ptTheme from "./locales/pt/theme.json";

export const vigDesignSystemTranslations = {
  en: {
    ...enAssistant,
    ...enBento,
    ...enCommon,
    ...enDialog,
    ...enForms,
    ...enLanguage,
    ...enNav,
    ...enSidebar,
    ...enTheme,
  },
  pt: {
    ...ptAssistant,
    ...ptBento,
    ...ptCommon,
    ...ptDialog,
    ...ptForms,
    ...ptLanguage,
    ...ptNav,
    ...ptSidebar,
    ...ptTheme,
  },
};

type Bundle = Record<string, unknown>;

const isBranch = (value: unknown): value is Bundle =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * VDS94 — merge leaf by leaf, with the product's leaf winning.
 *
 * A spread merges a namespace at a time, so a product that ships its own
 * `common` replaced the package's `common` outright and every key this package
 * asks for under it fell back to an English `defaultValue`. VDS51 and VDS93
 * cannot see that: they read this package's bundles, which are complete. The
 * consoles grew a `common` of their own before this package existed, so the
 * namespaces most likely to collide are exactly the ones being added to.
 */
function mergeBundles(ours: Bundle, theirs: Bundle): Bundle {
  const merged: Bundle = { ...ours };

  for (const [key, value] of Object.entries(theirs)) {
    const mine = merged[key];
    merged[key] = isBranch(mine) && isBranch(value) ? mergeBundles(mine, value) : value;
  }

  return merged;
}

/**
 * Initialize i18n with design system translations.
 * Call this in your app's entry point, optionally merging with app-specific translations.
 *
 * Where a key exists on both sides the product's value wins; where only this
 * package has one, it survives rather than being dropped with its namespace.
 *
 * VDS104 — the languages are the union of both sides, not this package's two.
 *
 * The loop walked `["en", "pt"]`, so a product passing `es` or `fr` was read at
 * neither key and got an instance the language simply did not exist in. Nothing
 * rejected the argument and nothing warned: the call returned normally and the
 * product's own screens read the fallback language. That is VDS94's failure one
 * level up — per language rather than per key — and it has the same answer.
 */
export function initVigI18n(appTranslations?: Record<string, Record<string, unknown>>) {
  const mergedResources: Record<string, { translation: Record<string, unknown> }> = {};

  const ours: Record<string, Bundle | undefined> = vigDesignSystemTranslations;
  const theirs: Record<string, Bundle | undefined> = appTranslations ?? {};

  // A language only one side declares arrives whole; one both declare merges
  // leaf by leaf, with the product winning.
  for (const lang of new Set([...Object.keys(ours), ...Object.keys(theirs)])) {
    mergedResources[lang] = {
      translation: mergeBundles(ours[lang] ?? {}, theirs[lang] ?? {}),
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
 *
 * A key the host already has is never replaced; one it lacks is filled in. That
 * is `addResourceBundle` with `deep` on and `overwrite` off, in one call per
 * language.
 *
 * VDS94 — this used to add a namespace only where the host had none, so a host
 * with a `common` of its own received none of the package's `common` keys and
 * read the English defaults. Skipping the whole namespace was the bug; the guard
 * it needed is per key, which is what `overwrite: false` already is.
 */
export function registerVigTranslations(i18nInstance: typeof i18n) {
  for (const [lang, translations] of Object.entries(vigDesignSystemTranslations)) {
    i18nInstance.addResourceBundle(lang, "translation", translations, true, false);
  }
}

export { i18n };
