import { render, screen } from "@testing-library/react"
import { createInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import { vigDesignSystemTranslations } from "../i18n"
import { LanguageSwitcher } from "./language-switcher"

// VDS95 — the switcher's own name comes from the bundles.
//
// It asked for `language.toggle` with an inline English default, and no locale
// shipped a `language` namespace. VDS51 reads the owned namespaces off the
// bundle directory, so it filed the key beside `llm.title` and `home.title` — the
// product's own nouns — and passed. The rule is right for those; it was wrong
// here, because this is the package's component naming itself and nothing about
// a product changes what the button does.
//
// The button is icon-only, so this name is the whole of what a screen reader
// gets. Every product but roadkeep-gui, which supplied the key itself, heard it
// in English.

function draw(lng: "en" | "pt") {
  const i18n = createInstance()
  i18n.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    resources: {
      en: { translation: vigDesignSystemTranslations.en },
      pt: { translation: vigDesignSystemTranslations.pt },
    },
  })
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSwitcher />
    </I18nextProvider>,
  )
}

describe("LanguageSwitcher names itself from the bundles", () => {
  it("reads its English name", () => {
    draw("en")

    expect(screen.getByRole("button", { name: "Change language" })).toBeInTheDocument()
  })

  it("reads its Portuguese name, which is the case that was broken", () => {
    draw("pt")

    expect(
      screen.getByRole("button", { name: vigDesignSystemTranslations.pt.language.toggle }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Change language" })).not.toBeInTheDocument()
  })

  it("ships the key in both locales rather than leaning on a default", () => {
    // The bug was invisible because the component carried its own English
    // fallback: the button read correctly in en whether or not anything shipped.
    expect(vigDesignSystemTranslations.en.language.toggle).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.language.toggle).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.language.toggle).not.toBe(
      vigDesignSystemTranslations.en.language.toggle,
    )
  })
})
