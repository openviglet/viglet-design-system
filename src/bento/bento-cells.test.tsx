import { render, screen } from "@testing-library/react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { BentoChangeCell, BentoIdentityCell } from "./index"

// VDS207 — the two cells every list draws: who a row is, and when and by whom it
// last changed. Asserted as a reader meets them, sighted or not.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
  await i18next.changeLanguage("en")
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

const NOW = new Date("2026-10-05T12:00:00Z")

describe("BentoIdentityCell", () => {
  it("draws the initials, the name and a second line", () => {
    const { container } = draw(<BentoIdentityCell name="Viglet Docs" detail="docs.viglet.org" />)

    expect(screen.getByText("Viglet Docs")).toBeInTheDocument()
    expect(screen.getByText("docs.viglet.org")).toHaveClass("truncate")
    const square = container.querySelector("[aria-hidden='true']")!
    expect(square).toHaveTextContent("VD")
  })

  it("gives the same name the same tone, and a named tone wins", () => {
    const tone = (ui: ReactElement) =>
      [...draw(ui).container.querySelector("[aria-hidden='true']")!.classList].find((c) => c.startsWith("bento-tone-"))

    expect(tone(<BentoIdentityCell name="Marketing" />)).toBe(tone(<BentoIdentityCell name="Marketing" />))
    expect(tone(<BentoIdentityCell name="Marketing" tone="rose" />)).toBe("bento-tone-rose")
  })

  it("leaves out the second line when there is none", () => {
    const { container } = draw(<BentoIdentityCell name="Solo" />)
    expect(container.querySelectorAll(".text-muted-foreground")).toHaveLength(0)
  })
})

describe("BentoChangeCell", () => {
  it("says how long ago, and gives the exact instant as its name and tooltip", () => {
    const { container } = draw(<BentoChangeCell at="2026-10-03T12:00:00Z" now={NOW} />)

    expect(screen.getByText("2 days ago")).toHaveAttribute("aria-hidden", "true")
    const time = container.querySelector("time")!
    expect(time).toHaveAttribute("dateTime", "2026-10-03T12:00:00.000Z")
    expect(time.title).toMatch(/October 3, 2026/)
    expect(time).toHaveTextContent(time.title)
  })

  it("draws a date instead of a relative time past a month", () => {
    draw(<BentoChangeCell at="2026-06-01T12:00:00Z" now={NOW} />)
    expect(screen.getByText("Jun 1, 2026")).toBeInTheDocument()
  })

  it("names who changed it, and marks an agent", () => {
    draw(
      <>
        <BentoChangeCell at={NOW} now={NOW} actor="Ana" />
        <BentoChangeCell at={NOW} now={NOW} actor="Publisher" agent />
      </>,
    )
    expect(screen.getByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Publisher")).toBeInTheDocument()
    expect(screen.getAllByText("Agent")).toHaveLength(1)
    expect(screen.getAllByText("now")).toHaveLength(2)
  })

  it("shows a value it cannot read as a date as it was given", () => {
    draw(<BentoChangeCell at="yesterday-ish" now={NOW} />)
    expect(screen.getAllByText("yesterday-ish").length).toBeGreaterThan(0)
  })
})
