import { render, screen } from "@testing-library/react"
import { createInstance } from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { describe, expect, it } from "vitest"

import { AppSwitcher } from "./app-switcher"
import { Stepper } from "./ui/stepper"
import { vigDesignSystemTranslations } from "../i18n"

// VDS98 — the two components that still spoke English through a prop default.
//
// The literals gate now reports the shape, and the specimens in
// literals.test.ts hold that. What a gate reading source cannot tell you is
// whether the replacement was wired up: renaming the parameter and forgetting to
// use the resolved value renders undefined, and every source-level check still
// passes. That is what these are for.

function draw(lng: "en" | "pt", ui: ReactElement) {
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

const pt = vigDesignSystemTranslations.pt.common

describe("Stepper.Completion", () => {
  it("says the pending word in the reader's language", () => {
    draw("pt", <Stepper completedSteps={[false]}><Stepper.Completion /></Stepper>)

    expect(screen.getByText(pt.completeAllSteps)).toBeInTheDocument()
    expect(screen.queryByText("Complete all steps above")).not.toBeInTheDocument()
  })

  it("says the ready word once every step is done", () => {
    draw("pt", <Stepper completedSteps={[true, true]}><Stepper.Completion /></Stepper>)

    expect(screen.getByText(pt.readyToSubmit)).toBeInTheDocument()
  })

  it("lets a product pass its own words instead", () => {
    draw(
      "pt",
      <Stepper completedSteps={[true]}>
        <Stepper.Completion readyLabel="Pode enviar" pendingLabel="Falta algo" />
      </Stepper>,
    )

    expect(screen.getByText("Pode enviar")).toBeInTheDocument()
  })
})

describe("AppSwitcher", () => {
  const apps = [{ id: "turing", name: "Turing", href: "/turing" }]

  it("names its trigger and its close overlay in the reader's language", () => {
    draw("pt", <AppSwitcher open onToggle={() => {}} apps={apps} />)

    expect(screen.getByTitle(pt.apps)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: pt.closeAppSwitcher })).toBeInTheDocument()
    expect(screen.queryByTitle("Apps")).not.toBeInTheDocument()
  })

  it("lets a product pass its own words instead", () => {
    draw(
      "pt",
      <AppSwitcher open onToggle={() => {}} apps={apps} triggerTitle="Produtos" closeLabel="Fechar" />,
    )

    expect(screen.getByTitle("Produtos")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument()
  })
})
