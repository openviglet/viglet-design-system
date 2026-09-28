import { render, screen, within } from "@testing-library/react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"

import { BentoFormHero, BentoHero, BentoTrail, type BentoTrailStep } from "./index"

// VDS184 — a back link names one parent, and a CMS nests deeper than that. The
// trail draws the ancestors where the back link sits, and a route with one
// parent keeps the arrow.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

const draw = (ui: ReactElement) =>
  render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )

const steps = (n: number): BentoTrailStep[] =>
  Array.from({ length: n }, (_, i) => ({ to: `/content/${i}`, label: `Level ${i}` }))

describe("a hero's trail", () => {
  it("renders the ancestors as linked steps, in order", () => {
    draw(<BentoHero title="Post" trail={steps(3)} />)

    const nav = screen.getByRole("navigation", { name: /Location|bento\.trail\.label/ })
    const links = within(nav).getAllByRole("link")
    expect(links.map((l) => l.textContent)).toEqual(["Level 0", "Level 1", "Level 2"])
    expect(links[2]).toHaveAttribute("href", "/content/2")
  })

  it("keeps the arrow back link for a route with one parent", () => {
    const { container } = draw(<BentoHero title="Site" trail={[{ to: "/sites", label: "Sites" }]} />)

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sites" })).toHaveAttribute("href", "/sites")
    expect(container.querySelector("svg.tabler-icon-arrow-left")).not.toBeNull()
  })

  it("leaves backTo as it was when no trail is given", () => {
    draw(<BentoHero title="Site" backTo="/sites" backLabel="Sites" />)

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sites" })).toHaveAttribute("href", "/sites")
  })

  it("lets a bespoke eyebrow win over the trail", () => {
    draw(<BentoHero title="Post" eyebrow="Custom" trail={steps(3)} />)

    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument()
  })

  it("collapses the middle of a deep trail on screen and keeps every step for a screen reader", () => {
    draw(<BentoTrail steps={steps(7)} />)

    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(7)
    const shown = items.filter((li) => !li.classList.contains("sr-only")).map((li) => within(li).getByRole("link").textContent)
    // The root, then the two nearest: where the tree starts and where the reader is.
    expect(shown).toEqual(["Level 0", "Level 5", "Level 6"])
    expect(screen.getByText("…")).toBeInTheDocument()
  })

  it("is drawn by a form hero too", () => {
    draw(<BentoFormHero title="New post" trail={steps(2)} onCancel={() => {}} />)

    expect(within(screen.getByRole("navigation")).getAllByRole("link")).toHaveLength(2)
  })
})
