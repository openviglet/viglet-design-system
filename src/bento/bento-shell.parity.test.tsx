import { render } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { page } from "vitest/browser"

import "@/styles/index.css"
import "./bento.css"

import { VigletAssistant } from "@/components/ui/viglet-assistant"

import { BentoBackToTop, BentoShell, type BentoShellColumn } from "./index"

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
})

afterEach(() => {
  document.body.replaceChildren()
  window.scrollTo(0, 0)
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
  beforeEach(async () => {
    // Wider than the widest column, so every width is the column's and not the viewport's.
    await page.viewport(1800, 1000)
  })

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

/**
 * VDS133 — one corner, two tenants.
 *
 * The dock was fixed bottom-5 right-5 at z-50 and the back-to-top control bottom-6
 * right-6 at z-40, so on any page long enough to need the button the mascot sat on
 * top of it. Asserted as geometry, because the defect was never in either
 * component's markup: each was correct alone.
 */
describe("BentoShell's corner", () => {
  const CAPTION =
    "The import finished: 1,204 documents indexed and 3 skipped, because their language is not configured."

  const overlap = (a: DOMRect, b: DOMRect) =>
    a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

  async function settle(button: HTMLElement, dock: HTMLElement) {
    // Past the reveal threshold, then settled: the button springs in from below,
    // and its opacity reaches 1 as the transition ends.
    window.scrollTo(0, 1500)
    window.dispatchEvent(new Event("scroll"))
    await expect.poll(() => getComputedStyle(button).opacity).toBe("1")
    // And the caption typed out in full, since its box grows as it types.
    const caption = dock.querySelector<HTMLElement>("span.absolute")!
    await expect.poll(() => caption.querySelector("[aria-hidden='true']")?.textContent, { timeout: 5000 }).toBe(CAPTION)
    return caption
  }

  async function drawCorner() {
    const { container } = render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoShell dock={<VigletAssistant caption={CAPTION} />}>
            <div style={{ height: 4000 }}>a long page</div>
          </BentoShell>
        </MemoryRouter>
      </I18nextProvider>,
    )
    const corner = container.querySelector<HTMLElement>("[data-slot='bento-shell-corner']")!
    const button = corner.firstElementChild as HTMLElement
    const dock = corner.lastElementChild as HTMLElement
    return { button, dock, caption: await settle(button, dock) }
  }

  it("measures the overlap it exists to prevent, where no shell holds the corner", async () => {
    // Without this the geometry below could pass by measuring nothing.
    await page.viewport(1440, 900)
    const { container } = render(
      <I18nextProvider i18n={i18next}>
        <div style={{ height: 4000 }}>a long page</div>
        <BentoBackToTop />
        <VigletAssistant caption={CAPTION} />
      </I18nextProvider>,
    )
    const button = container.querySelector<HTMLElement>("button[aria-label]")!
    const dock = container.lastElementChild as HTMLElement
    await settle(button, dock)

    expect(overlap(button.getBoundingClientRect(), dock.getBoundingClientRect())).toBe(true)
  })

  it.each([
    ["mobile", 375, 800],
    ["desktop", 1440, 900],
  ] as const)("keeps the dock, its caption and the back-to-top control apart on %s", async (_, width, height) => {
    await page.viewport(width, height)
    const { button, dock, caption } = await drawCorner()

    const b = button.getBoundingClientRect()
    const d = dock.getBoundingClientRect()
    const c = caption.getBoundingClientRect()

    expect(b.width, "the control is on screen, or there is nothing to measure").toBeGreaterThan(0)
    expect(overlap(b, d), "the dock covers the back-to-top control").toBe(false)
    expect(overlap(b, c), "the dock's caption covers the back-to-top control").toBe(false)
    // Above the dock, on the same right edge: the corner is the dock's.
    expect(b.bottom).toBeLessThanOrEqual(d.top)
    expect(Math.round(b.right)).toBe(Math.round(d.right))
    // Both on screen.
    expect(d.bottom).toBeLessThanOrEqual(height)
    expect(c.left).toBeGreaterThanOrEqual(0)
  })
})
