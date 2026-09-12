import { render } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { page } from "vitest/browser"

import "@/styles/index.css"
import "./bento.css"

import { BentoShell, type BentoShellColumn } from "./index"

/**
 * VDS131 — the reading column, measured.
 *
 * The contract gives `main` the width, the gutters and the rhythm, and a page
 * none of the three. A class list cannot show that holds: the width comes from a
 * custom property keyed by `data-column`, and only a browser resolves one. So
 * this lays the shell out at a desktop width and reads back what the column is,
 * and what a page that sets nothing of its own is given.
 */

const REM = 16

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
  // Wider than the widest column, so every width is the column's and not the viewport's.
  await page.viewport(1800, 1000)
})

afterEach(() => {
  document.body.replaceChildren()
})

function drawShell(column?: BentoShellColumn) {
  const { container } = render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>
        <BentoShell column={column} rail={<nav aria-label="Primary" className="fixed inset-y-0 left-0 w-16" />}>
          <div data-testid="page">a page that sets nothing</div>
        </BentoShell>
      </MemoryRouter>
    </I18nextProvider>,
  )
  const shell = container.querySelector<HTMLElement>("[data-slot='bento-shell']")!
  const main = container.querySelector<HTMLElement>("main")!
  const pageBox = container.querySelector<HTMLElement>("[data-testid='page']")!
  return { shell, main, pageBox }
}

const px = (value: string) => Number.parseFloat(value)

describe("BentoShell's reading column", () => {
  it.each([
    ["default", 80],
    ["narrow", 56],
    ["wide", 96],
  ] as const)("holds the %s column at %srem", (column, rem) => {
    const { main } = drawShell(column)
    const style = getComputedStyle(main)

    expect(px(style.maxWidth)).toBe(rem * REM)
    expect(Math.round(main.getBoundingClientRect().width)).toBe(rem * REM)
  })

  it("gives a page the column's content box, so the page sets no width of its own", () => {
    const { main, pageBox } = drawShell()
    const style = getComputedStyle(main)
    const gutter = px(style.paddingLeft)

    // The desktop gutter and rhythm, from the properties rather than the page.
    expect(gutter).toBe(2 * REM)
    expect(px(style.paddingRight)).toBe(2 * REM)
    expect(px(style.paddingTop)).toBe(2.5 * REM)

    const column = main.getBoundingClientRect()
    const box = pageBox.getBoundingClientRect()
    expect(Math.round(box.width)).toBe(Math.round(column.width - 2 * gutter))
    expect(Math.round(box.left)).toBe(Math.round(column.left + gutter))
  })

  it("centres the column in the space the rail leaves", () => {
    const { shell, main } = drawShell()
    const inner = shell.getBoundingClientRect()
    const rail = 4 * REM
    expect(px(getComputedStyle(shell).paddingLeft)).toBe(rail)

    const column = main.getBoundingClientRect()
    const left = column.left - (inner.left + rail)
    const right = inner.right - column.right
    expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
  })

  it("lets a full-width tool fill the viewport under the header", () => {
    const { shell, main } = drawShell("full")

    expect(getComputedStyle(main).maxWidth).toBe("none")
    expect(Math.round(shell.getBoundingClientRect().height)).toBe(1000)
    expect(Math.round(main.getBoundingClientRect().bottom)).toBe(1000)
  })
})
