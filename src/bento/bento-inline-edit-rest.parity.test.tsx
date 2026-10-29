import { render } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import "@/styles/index.css"
import "./bento.css"

import { BentoHero, BentoInlineEdit } from "./index"

/**
 * VDS233 — an inline title reads as a title until the reader shows intent, and
 * as one underline while it is edited.
 *
 * The existing parity test covers where focus goes; this one covers what is
 * drawn. In edit mode `Input`'s own frame used to survive the component's
 * `border-b`, so the field was a box with no padding around the title, and the
 * select-all on entry painted a second box inside it.
 */

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

afterEach(() => {
  document.body.replaceChildren()
  delete document.documentElement.dataset.theme
  document.documentElement.classList.remove("dark")
})

function draw(autoFocus = false) {
  const { container } = render(
    <I18nextProvider i18n={i18next}>
      <BentoHero
        title={
          <BentoInlineEdit
            value="ShowCase"
            onSave={() => {}}
            ariaLabel="Title"
            autoFocus={autoFocus}
            className="text-2xl font-semibold tracking-tight md:text-3xl"
          />
        }
      />
    </I18nextProvider>,
  )
  return container
}

/**
 * Each side's width when it is painted in a colour that shows, else 0, and
 * whether any shadow has size: Tailwind's ring layers resolve to zero-size
 * shadows, which draw nothing.
 */
function frame(el: Element) {
  const s = getComputedStyle(el)
  const side = (width: string, color: string) => (color === "rgba(0, 0, 0, 0)" ? 0 : Number.parseFloat(width))
  return {
    top: side(s.borderTopWidth, s.borderTopColor),
    right: side(s.borderRightWidth, s.borderRightColor),
    bottom: side(s.borderBottomWidth, s.borderBottomColor),
    left: side(s.borderLeftWidth, s.borderLeftColor),
    shadow: (s.boxShadow.match(/-?\d+(\.\d+)?px/g) ?? []).some((length) => Number.parseFloat(length) !== 0),
    fill: s.backgroundColor,
  }
}

describe("an inline title", () => {
  it("draws no frame, fill or shadow at rest, on the title or around it", () => {
    const container = draw()
    const display = container.querySelector("button[aria-label='Title']")!
    expect(frame(display)).toEqual({ top: 0, right: 0, bottom: 0, left: 0, shadow: false, fill: "rgba(0, 0, 0, 0)" })
    const heading = display.closest("h1")!
    expect(frame(heading)).toMatchObject({ top: 0, right: 0, bottom: 0, left: 0, shadow: false })
  })

  it.each(["light", "dark"] as const)("draws one underline while edited, on the %s ground", (theme) => {
    if (theme === "dark") document.documentElement.classList.add("dark")
    const container = draw(true)
    const field = container.querySelector("input[aria-label='Title']")!
    expect(frame(field)).toEqual({ top: 0, right: 0, bottom: 1, left: 0, shadow: false, fill: "rgba(0, 0, 0, 0)" })
    expect(getComputedStyle(field).borderTopLeftRadius).toBe("0px")
  })
})
