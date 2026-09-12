import { render, screen } from "@testing-library/react"
import { createInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import { vigDesignSystemTranslations } from "../../i18n"
import { Toaster } from "./sonner"

// VDS97 — the region every notice lands in, named by this package.
//
// Passing sonner no containerAriaLabel left it announcing its own default,
// `Notifications`, in every product and every language. The VDS93 literals gate
// cannot catch that and should not: there is no literal in this package's source
// to find. The English is a dependency's, and the omission is the defect.
//
// That shape is the thing to remember — every gate here reads this package's own
// source, and none of them can see a word a dependency supplies.

function draw(lng: "en" | "pt", ui = <Toaster />) {
  const i18n = createInstance()
  i18n.use(initReactI18next).init({
    lng,
    fallbackLng: "en",
    resources: {
      en: { translation: vigDesignSystemTranslations.en },
      pt: { translation: vigDesignSystemTranslations.pt },
    },
  })
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>)
}

/** sonner names its container with an aria-label, which makes it a region. */
const region = () => screen.getByLabelText(/./, { selector: "[aria-label]" })

describe("Toaster names its region from the bundles", () => {
  it("says the package's English word", () => {
    draw("en")

    expect(region()).toHaveAttribute(
      "aria-label",
      expect.stringContaining(vigDesignSystemTranslations.en.common.notifications),
    )
  })

  it("says Portuguese in a Portuguese product, which is the case that was broken", () => {
    draw("pt")

    const label = region().getAttribute("aria-label") ?? ""
    expect(label).toContain(vigDesignSystemTranslations.pt.common.notifications)
    expect(label).not.toContain("Notifications")
  })

  it("lets a product pass its own word instead", () => {
    // The prop goes in before the spread, so a caller still wins.
    draw("pt", <Toaster containerAriaLabel="Avisos do sistema" />)

    expect(region()).toHaveAttribute("aria-label", expect.stringContaining("Avisos do sistema"))
  })

  it("ships the key in both locales", () => {
    expect(vigDesignSystemTranslations.en.common.notifications).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.common.notifications).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.common.notifications).not.toBe(
      vigDesignSystemTranslations.en.common.notifications,
    )
  })
})
