import { render, screen } from "@testing-library/react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"

import { BentoBackLink, BentoFormHero, BentoHero } from "./index"

// VDS75 — the back-link eyebrow's arrow rule, as a gate rather than a sentence
// in the authoring contract.
//
// The eyebrow gets the same small upper-case muted treatment whether it is the
// way back to the parent list or just says what kind of thing this is. The arrow
// is the only difference a reader has between those two, which is why the rule
// is worth holding: a page that loses it has not lost decoration, it has lost the
// distinction.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function draw(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

/** The arrow, as a reader meets it: inside the link, and silent to a screen reader. */
function arrowIn(link: HTMLElement) {
  const icon = link.querySelector("svg")
  return icon?.getAttribute("aria-hidden") === "true" ? icon : null
}

describe("the back-link eyebrow leads with an arrow", () => {
  it("renders one from BentoBackLink, pointing where it says", () => {
    draw(<BentoBackLink to="/models">All models</BentoBackLink>)

    const link = screen.getByRole("link", { name: "All models" })
    expect(link).toHaveAttribute("href", "/models")
    expect(arrowIn(link)).toBeTruthy()
  })

  it("gives BentoHero one from backTo, so no page re-types it", () => {
    draw(<BentoHero backTo="/models" backLabel="All models" title="GPT-4o" />)

    const link = screen.getByRole("link", { name: "All models" })
    expect(link).toHaveAttribute("href", "/models")
    expect(arrowIn(link)).toBeTruthy()
  })

  it("gives BentoFormHero one from backTo too", () => {
    draw(
      <BentoFormHero backTo="/models" backLabel="All models" title="New model" onCancel={() => {}} />,
    )

    const link = screen.getByRole("link", { name: "All models" })
    expect(arrowIn(link)).toBeTruthy()
  })

  it("draws no arrow on an eyebrow that navigates nowhere", () => {
    // An arrow promises a destination. On a label that is not a link, the promise
    // is one the click cannot keep.
    const { container } = draw(<BentoHero eyebrow="Draft" title="Untitled" />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
    expect(container.querySelector("svg")).toBeNull()
  })

  it("keeps the arrow when a bespoke eyebrow composes BentoBackLink", () => {
    // The sanctioned way to put something after the link — a status marker, a
    // count — without re-typing the arrow inline.
    draw(
      <BentoHero
        eyebrow={
          <>
            <BentoBackLink to="/models">All models</BentoBackLink>
            <span> · draft</span>
          </>
        }
        title="GPT-4o"
      />,
    )

    expect(arrowIn(screen.getByRole("link", { name: "All models" }))).toBeTruthy()
  })

  it("loses the arrow when a page passes both eyebrow and backTo", () => {
    // `eyebrow` wins, and it wins silently — which is the trap the contract
    // names. Held here so the precedence is a documented behaviour rather than
    // something a page discovers by looking at a screenshot.
    draw(<BentoHero eyebrow="All models" backTo="/models" backLabel="All models" title="GPT-4o" />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })
})
