import { act, render, screen } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"

import "@/styles/index.css"
import "./bento.css"

import { BentoDataTable } from "./index"

/**
 * VDS204 — a list is the page, so a table given no `height` scrolls with it.
 *
 * Measured in a browser, because what is asserted is layout: that the page has
 * one scrollbar and not two, that the header row stays in view while the page
 * moves, and that only the rows the page shows are mounted.
 */

interface Post {
  id: string
  title: string
}

const ROWS: Post[] = Array.from({ length: 400 }, (_, i) => ({ id: `p${i}`, title: `Post ${i}` }))
const ROW = 40

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

afterEach(() => {
  window.scrollTo(0, 0)
  document.body.replaceChildren()
})

function draw() {
  render(
    <I18nextProvider i18n={i18next}>
      <div style={{ paddingTop: 200 }}>
        <BentoDataTable<Post>
          rows={ROWS}
          getRowId={(p) => p.id}
          getRowLabel={(p) => p.title}
          columns={[{ id: "title", header: "Title", cell: (p) => p.title, sortValue: (p) => p.title }]}
          label="Posts"
          rowHeight={ROW}
        />
      </div>
    </I18nextProvider>,
  )
  const [head, rows] = screen.getAllByRole("rowgroup")
  return { head, rows }
}

const mounted = () => screen.getAllByRole("row").filter((row) => row.getAttribute("aria-rowindex") !== "1")

async function scrollPage(top: number) {
  await act(async () => {
    window.scrollTo({ top, behavior: "instant" })
    window.dispatchEvent(new Event("scroll"))
  })
}

describe("a table with no height", () => {
  it("is as tall as its rows, so the page is the only thing that scrolls", () => {
    const { rows } = draw()
    expect(rows.getBoundingClientRect().height).toBe(ROWS.length * ROW)
    expect(rows.scrollHeight).toBe(rows.clientHeight)
    expect(document.documentElement.scrollHeight).toBeGreaterThan(window.innerHeight)
  })

  it("mounts only the rows the page shows, and follows the page as it scrolls", async () => {
    draw()
    expect(mounted().length).toBeLessThan(ROWS.length / 4)

    await scrollPage(8000)
    const indexes = mounted().map((row) => Number(row.getAttribute("aria-rowindex")))
    expect(mounted().length).toBeLessThan(ROWS.length / 4)
    // 8000 px down, less the 200 px above the table and its toolbar, is past row 180.
    expect(Math.min(...indexes)).toBeGreaterThan(150)
    expect(Math.max(...indexes)).toBeLessThan(ROWS.length)
  })

  it("keeps the header row in view while the page scrolls under it", async () => {
    const { head } = draw()
    await scrollPage(6000)
    const top = head.getBoundingClientRect().top
    expect(top).toBeGreaterThanOrEqual(0)
    expect(top).toBeLessThan(1)
  })

  it("scrolls the page to a row the keyboard moves to", async () => {
    draw()
    await userEvent.click(screen.getByText("Post 0"))
    await userEvent.keyboard("{End}")
    // Unsorted, the last row is the last one given.
    const end = screen.getByText("Post 399").closest<HTMLElement>('[role="row"]')!
    expect(document.activeElement).toBe(end)
    expect(end.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight + 1)
    expect(window.scrollY).toBeGreaterThan(0)
  })
})
