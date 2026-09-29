import { render, screen } from "@testing-library/react"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"

import en from "@/i18n/locales/en/bento.json"
import pt from "@/i18n/locales/pt/bento.json"

import {
  BENTO_RECORD_STATES,
  BentoEmptyState,
  BentoEntityTile,
  BentoFormSection,
  BentoHeroIconPicker,
  BentoListPage,
  BentoStatusMarker,
  BentoTile,
} from "./index"

// VDS182 — colour that is everywhere means nothing. The gradient chip names a
// thing, so it is drawn where one thing is named — an entity's hero and a hub's
// tiles — and nowhere a list, a row or a form section names many. Colour on a
// list is a record's state, as a dot and a word.

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

const chips = (container: HTMLElement) => container.querySelectorAll(".bento-chip")

describe("the gradient chip names one thing", () => {
  it("is drawn in an entity hero", () => {
    const { container } = draw(
      <BentoHeroIconPicker tone="blue" defaultIcon={IconCpu2} onChange={() => {}} readOnly />,
    )
    expect(chips(container).length).toBeGreaterThan(0)
  })

  it("is drawn on a hub's tile", () => {
    const { container } = draw(<BentoTile tone="blue" eyebrow="Generative AI" title="Agents" span="col-span-2" icon={IconCpu2} to="/agents" />)
    expect(chips(container).length).toBeGreaterThan(0)
  })

  it("is not drawn on a list's hero, its New tile or a record's tile", () => {
    const { container } = draw(
      <BentoListPage
        heroIcon={IconCpu2}
        tone="violet"
        title="Models"
        subtitle="All models"
        items={[{ id: "a", name: "Alpha" }]}
        itemKey={(item) => item.id}
        tryAgainUrl="/models"
        newRoute="/models/new"
        newLabel="New model"
        emptyTitle="No models yet"
        emptyDescription="Add one to get started."
        renderTile={(item) => (
          <BentoEntityTile key={item.id} to={`/models/${item.id}`} defaultIcon={IconCpu2} tone="rose" title={item.name} />
        )}
      />,
    )
    expect(screen.getByText("Alpha")).toBeInTheDocument()
    expect(chips(container)).toHaveLength(0)
    expect(container.querySelectorAll(".bento-well").length).toBeGreaterThanOrEqual(3)
  })

  it("is not drawn on a form section or an empty state", () => {
    const { container } = draw(
      <>
        <BentoFormSection tone="amber" title="Connection" icon={IconCpu2}>
          <input aria-label="Endpoint" />
        </BentoFormSection>
        <BentoEmptyState tone="emerald" title="Nothing here" />
      </>,
    )
    expect(chips(container)).toHaveLength(0)
  })
})

describe("tones are record states", () => {
  it("names five states", () => {
    expect(BENTO_RECORD_STATES).toEqual(["published", "draft", "scheduled", "changed", "archived"])
  })

  it.each(BENTO_RECORD_STATES)("draws %s as a dot and a word", (state) => {
    const { container } = draw(<BentoStatusMarker state={state} />)
    const mark = container.querySelector(`[data-state="${state}"]`)
    expect(mark).toHaveClass(`bento-state-${state}`)
    expect(mark?.querySelector(".bento-state-dot")).toBeInTheDocument()
    expect(mark).toHaveTextContent(`bento.state.${state}`)
  })

  it("keeps the save cues ahead of the state", () => {
    const { container } = draw(<BentoStatusMarker state="published" dirty />)
    expect(container.querySelector("[data-state]")).toBeNull()
    expect(container.querySelector(".bento-status-warn")).toBeInTheDocument()
  })

  it("draws a record tile's state through the same marker", () => {
    const { container } = draw(
      <BentoEntityTile to="/models/a" defaultIcon={IconCpu2} title="Alpha" state="scheduled" />,
    )
    expect(container.querySelector('[data-state="scheduled"]')).toBeInTheDocument()
  })

  it("has a word for every state in both locales", () => {
    for (const locale of [en, pt]) {
      expect(Object.keys(locale.bento.state).sort()).toEqual([...BENTO_RECORD_STATES].sort())
    }
  })
})
