import { render, screen } from "@testing-library/react"
import { createInstance } from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import { vigDesignSystemTranslations } from "../../i18n"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "./navigation-menu"

// VDS105 — the nav landmark, named by this package rather than by Radix.
//
// `@radix-ui/react-navigation-menu` renders its root as a `nav` carrying a
// hardcoded aria-label="Main", so passing none left the landmark announced as
// "Main" in every product and every language. Same shape as VDS97's Toaster:
// the English belongs to a dependency, there is no literal in this package's
// source, and the omission is the defect.
//
// The literals gate now reports that shape too — `src/i18n/literals.test.ts`
// holds the list of primitives that name themselves. This file holds the other
// end of it: what a screen reader is actually handed.

function draw(lng: "en" | "pt", ui = <Menu />) {
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

function Menu(props: React.ComponentProps<typeof NavigationMenu>) {
  return (
    <NavigationMenu {...props}>
      <NavigationMenuList>
        <NavigationMenuItem />
      </NavigationMenuList>
    </NavigationMenu>
  )
}

const landmark = () => screen.getByRole("navigation")

describe("NavigationMenu names its landmark from the bundles", () => {
  it("says the package's English word", () => {
    draw("en")

    expect(landmark()).toHaveAccessibleName(vigDesignSystemTranslations.en.common.mainNavigation)
  })

  it("says Portuguese in a Portuguese product, which is the case that was broken", () => {
    draw("pt")

    expect(landmark()).toHaveAccessibleName(vigDesignSystemTranslations.pt.common.mainNavigation)
    // The regression: Radix's own word, in a product that speaks neither.
    expect(landmark().getAttribute("aria-label")).not.toBe("Main")
  })

  it("lets a product pass its own word instead", () => {
    // A page with a second nav needs to tell them apart, and the attribute goes
    // in before the spread so a caller still wins.
    draw("pt", <Menu aria-label="Navegação do rodapé" />)

    expect(landmark()).toHaveAccessibleName("Navegação do rodapé")
  })

  it("ships the key in both locales", () => {
    expect(vigDesignSystemTranslations.en.common.mainNavigation).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.common.mainNavigation).toBeTruthy()
    expect(vigDesignSystemTranslations.pt.common.mainNavigation).not.toBe(
      vigDesignSystemTranslations.en.common.mainNavigation,
    )
  })
})
