import { act, render } from "@testing-library/react"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import "@/styles/index.css"
import "./bento.css"

import { BentoEntityTile, BentoListPage, type BentoListLayout } from "./index"

/**
 * VDS153 — the layout editor keeps its place, measured where focus is real.
 *
 * jsdom leaves focus on a button that becomes disabled and a browser moves it to
 * the body, which gradient-button.parity.test.tsx shows against a bare button.
 * This presses Save layout from focus with the product's write still running and
 * reads where focus is while it runs.
 */

interface Item {
  id: string
  name: string
}

const items: Item[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
]

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

afterEach(() => {
  document.body.replaceChildren()
})

describe("the layout editor while a save runs", () => {
  it("keeps focus on the control that was pressed", async () => {
    let settle!: () => void
    const layout: BentoListLayout = {
      data: { listId: "models", source: "DEFAULT", canEditGlobal: false, entries: [] },
      onSave: () => new Promise<void>((resolve) => (settle = resolve)),
    }
    const { container, unmount } = render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoListPage<Item>
            items={items}
            tryAgainUrl="/models"
            heroIcon={IconCpu2}
            title="Models"
            subtitle="Every model this install can reach"
            newRoute="/models/new"
            newLabel="New model"
            itemKey={(i) => i.id}
            renderTile={(item, emphasis) => (
              <BentoEntityTile to={`/models/${item.id}`} emphasis={emphasis} defaultIcon={IconCpu2} title={item.name} />
            )}
            emptyTitle="No models yet"
            emptyDescription="Add one to get started"
            listId="models"
            layout={layout}
          />
        </MemoryRouter>
      </I18nextProvider>,
    )

    const byText = (text: string) =>
      [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text))!

    await act(async () => byText("Customize layout").click())
    const save = byText("Save layout")
    save.focus()
    expect(document.activeElement).toBe(save)

    await act(async () => save.click())
    expect(save.getAttribute("aria-busy")).toBe("true")
    expect(document.activeElement).toBe(save)

    await act(async () => settle())
    unmount()
  })
})
