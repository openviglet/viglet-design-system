import { render, screen } from "@testing-library/react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { BentoChangeMark, BentoDiff } from "./index"

// VDS170 — the chip BentoDiff draws beside a field, lifted out so a list of what
// changed marks each item in the same words and tints as the comparison it opens.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

describe("BentoChangeMark", () => {
  it("names each state in the chip's words and tints", () => {
    draw(
      <>
        <BentoChangeMark state="added" />
        <BentoChangeMark state="removed" />
        <BentoChangeMark state="changed" />
        <BentoChangeMark state="unchanged" />
      </>,
    )
    expect(screen.getByText("Added")).toHaveClass("bento-status-on")
    expect(screen.getByText("Removed")).toHaveClass("bento-status-error")
    expect(screen.getByText("Changed")).toHaveClass("bento-status-warn")
    expect(screen.getByText("Unchanged")).not.toHaveClass("bento-status")
  })

  it("says its word, not its letter, when compact", () => {
    const { container } = draw(<BentoChangeMark state="changed" compact />)
    const mark = container.querySelector('[data-slot="bento-change-mark"]')!
    // git's letter is what is seen...
    expect(mark.querySelector('[aria-hidden="true"]')).toHaveTextContent("M")
    // ...and the word is what a screen reader says and a pointer reads.
    expect(mark.querySelector(".sr-only")).toHaveTextContent("Changed")
    expect(mark).toHaveAttribute("title", "Changed")
    expect(mark).toHaveClass("bento-status-warn")
  })

  it("draws git's letters by default", () => {
    const { container } = draw(
      <>
        <BentoChangeMark state="added" compact />
        <BentoChangeMark state="removed" compact />
      </>,
    )
    const letters = [...container.querySelectorAll('[data-slot="bento-change-mark"] [aria-hidden="true"]')]
    expect(letters.map((el) => el.textContent)).toEqual(["A", "D"])
  })

  it("is the chip BentoDiff draws beside each field", () => {
    const { container } = draw(
      <BentoDiff before={{ title: "Old", slug: "a" }} after={{ title: "New", slug: "a" }} fields={[{ id: "title", label: "Title" }]} />,
    )
    const mark = container.querySelector('dt [data-slot="bento-change-mark"]')!
    expect(mark).toHaveAttribute("data-state", "changed")
    expect(mark).toHaveTextContent("Changed")
  })
})
