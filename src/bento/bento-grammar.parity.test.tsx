import { render } from "@testing-library/react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import "@/styles/index.css"
import "./bento.css"

import { BentoDataTable, BentoHero, type BentoGrammar } from "./index"

/**
 * VDS235 — a work grammar beside bento, measured where layout is real.
 *
 * Bento's hero took about 150px on every route of a console and every list sat
 * in a frosted card, including the pages people work in all day. `work` draws
 * the header on one line under a small way back, and the table flat on the
 * page ground.
 */

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

afterEach(() => {
  document.body.replaceChildren()
})

function draw(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>
        <div style={{ width: 1200 }}>{ui}</div>
      </MemoryRouter>
    </I18nextProvider>,
  ).container
}

const hero = (grammar: BentoGrammar) => (
  <BentoHero
    grammar={grammar}
    backTo="/sites"
    backLabel="Sites"
    title="Posts"
    trailing={<button type="button">New post</button>}
  />
)

describe("the work grammar", () => {
  it("draws the header compact: the way back above, title and actions on one line", () => {
    const work = draw(hero("work")).querySelector("header")!
    const title = work.querySelector("h1")!.getBoundingClientRect()
    const action = work.querySelector("button")!.getBoundingClientRect()

    // One line: the action's box overlaps the title's vertically.
    expect(action.top).toBeLessThan(title.bottom)
    expect(action.bottom).toBeGreaterThan(title.top)
    expect(work.getBoundingClientRect().height).toBeLessThanOrEqual(64)

    document.body.replaceChildren()
    const showcase = draw(hero("showcase")).querySelector("header")!
    expect(work.getBoundingClientRect().height).toBeLessThan(showcase.getBoundingClientRect().height)
  })

  it("draws the table flat on the page ground, with hairlines and no card", () => {
    const table = (grammar: BentoGrammar) =>
      draw(
        <BentoDataTable<{ id: string }>
          grammar={grammar}
          rows={[{ id: "a" }]}
          getRowId={(r) => r.id}
          columns={[{ id: "id", header: "Id", cell: (r) => r.id }]}
          label="Rows"
        />,
      ).querySelector("[data-slot='bento-data-table']")!

    const flat = getComputedStyle(table("work"))
    expect(flat.backgroundColor).toBe("rgba(0, 0, 0, 0)")
    expect(flat.backdropFilter).toBe("none")
    expect(flat.borderTopLeftRadius).toBe("0px")
    expect(Number.parseFloat(flat.borderTopWidth)).toBe(1)

    document.body.replaceChildren()
    expect(getComputedStyle(table("showcase")).borderTopLeftRadius).not.toBe("0px")
  })
})
