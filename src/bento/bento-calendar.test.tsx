import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoCalendar, type BentoCalendarEntry } from "./index"

// VDS172 — a month or week of caller-supplied entries, rescheduled by drag or by
// keyboard, drawn in the zone the page states.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
  // Dates are formatted in the reader's language, and the assertions read English.
  await i18next.changeLanguage("en")
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

const SAO_PAULO = "America/Sao_Paulo"
const ENTRIES: BentoCalendarEntry[] = [
  // 14:00 in São Paulo.
  { id: "launch", start: "2026-09-10T17:00:00Z", label: "Launch post" },
  { id: "late", start: "2026-09-30T23:30:00Z", label: "Late post", tone: "warn" },
]

const cell = (name: RegExp) => screen.getByRole("gridcell", { name })
const entry = (id: string) => document.querySelector<HTMLButtonElement>(`[data-entry="${id}"]`)!

describe("BentoCalendar", () => {
  it("draws a month in the zone it is given", () => {
    const { unmount } = draw(
      <BentoCalendar entries={ENTRIES} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} />,
    )
    expect(screen.getByRole("grid", { name: "September 2026" })).toBeInTheDocument()
    // 23:30 UTC is 20:30 on the 30th in São Paulo...
    expect(within(cell(/September 30, 2026/)).getByText("Late post")).toBeInTheDocument()
    expect(cell(/September 30, 2026/)).toHaveAccessibleName("Wednesday, September 30, 2026, 1 scheduled")
    expect(within(cell(/September 10, 2026/)).getByText("Launch post").closest("button")).toHaveTextContent("2:00 PM")
    unmount()

    // ...and already the 1st of October in Tokyo.
    draw(<BentoCalendar entries={ENTRIES} defaultDate="2026-10-15T12:00:00Z" timeZone="Asia/Tokyo" />)
    expect(within(cell(/October 1, 2026/)).getByText("Late post")).toBeInTheDocument()
  })

  it("moves an entry from the keyboard, keeping its time of day", async () => {
    const user = userEvent.setup()
    const onEntryMove = vi.fn()
    draw(
      <BentoCalendar entries={ENTRIES} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} onEntryMove={onEntryMove} />,
    )

    act(() => cell(/September 10, 2026/).focus())
    await user.keyboard("{Enter}")
    expect(entry("launch")).toHaveFocus()
    expect(entry("launch")).toHaveAccessibleDescription(/Space picks this up/)

    await user.keyboard(" ")
    expect(entry("launch")).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("status")).toHaveTextContent("Picked up Launch post.")
    expect(cell(/September 10, 2026/)).toHaveFocus()

    await user.keyboard("{ArrowRight}{ArrowRight}{Enter}")
    expect(onEntryMove).toHaveBeenCalledExactlyOnceWith("launch", new Date("2026-09-12T17:00:00Z"))
    expect(screen.getByRole("status")).toHaveTextContent("Moved Launch post to Saturday, September 12, 2026.")
    expect(entry("launch")).toHaveAttribute("aria-pressed", "false")
  })

  it("keeps the wall-clock time across a change of offset", async () => {
    const user = userEvent.setup()
    const onEntryMove = vi.fn()
    // 09:00 EDT on Saturday; daylight saving ends on Sunday the 1st.
    const entries = [{ id: "a", start: "2026-10-31T13:00:00Z", label: "Review" }]
    draw(
      <BentoCalendar
        entries={entries}
        defaultDate="2026-10-15T12:00:00Z"
        timeZone="America/New_York"
        onEntryMove={onEntryMove}
      />,
    )

    act(() => cell(/October 31, 2026/).focus())
    await user.keyboard("{Enter} {ArrowRight}{ArrowRight}{Enter}")
    // 09:00 EST on Monday.
    expect(onEntryMove).toHaveBeenCalledWith("a", new Date("2026-11-02T14:00:00Z"))
  })

  it("puts a picked-up entry back on Escape", async () => {
    const user = userEvent.setup()
    const onEntryMove = vi.fn()
    draw(
      <BentoCalendar entries={ENTRIES} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} onEntryMove={onEntryMove} />,
    )

    act(() => cell(/September 10, 2026/).focus())
    await user.keyboard("{Enter} {ArrowDown}{Escape}")
    expect(onEntryMove).not.toHaveBeenCalled()
    expect(screen.getByRole("status")).toHaveTextContent("Put Launch post back.")
  })

  it("moves an entry dropped on another day", () => {
    const onEntryMove = vi.fn()
    draw(
      <BentoCalendar entries={ENTRIES} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} onEntryMove={onEntryMove} />,
    )
    const data = new Map<string, string>()
    const dataTransfer = { setData: (k: string, v: string) => data.set(k, v), getData: (k: string) => data.get(k) ?? "" }

    expect(entry("launch")).toHaveAttribute("draggable", "true")
    act(() => {
      entry("launch").dispatchEvent(Object.assign(new Event("dragstart", { bubbles: true }), { dataTransfer }))
    })
    act(() => {
      cell(/September 17, 2026/).dispatchEvent(Object.assign(new Event("drop", { bubbles: true, cancelable: true }), { dataTransfer }))
    })
    expect(onEntryMove).toHaveBeenCalledWith("launch", new Date("2026-09-17T17:00:00Z"))
  })

  it("walks the days with the arrows and turns the period with PageDown", async () => {
    const user = userEvent.setup()
    const onRangeChange = vi.fn()
    draw(
      <BentoCalendar entries={[]} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} onRangeChange={onRangeChange} />,
    )
    // The month shown runs from the Sunday before the 1st to the Saturday after the 30th.
    expect(onRangeChange).toHaveBeenLastCalledWith({
      start: new Date("2026-08-30T03:00:00Z"),
      end: new Date("2026-10-04T03:00:00Z"),
    })
    // Only the focused day is a tab stop.
    expect(screen.getAllByRole("gridcell").filter((c) => c.tabIndex === 0)).toEqual([cell(/September 15, 2026/)])

    act(() => cell(/September 15, 2026/).focus())
    await user.keyboard("{ArrowDown}")
    expect(cell(/September 22, 2026/)).toHaveFocus()
    await user.keyboard("{PageDown}")
    expect(screen.getByRole("grid", { name: "October 2026" })).toBeInTheDocument()
    expect(cell(/October 22, 2026/)).toHaveFocus()
  })

  it("draws a week as one row of seven days", async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()
    draw(
      <BentoCalendar
        entries={ENTRIES}
        defaultDate="2026-09-10T12:00:00Z"
        timeZone={SAO_PAULO}
        weekStartsOn={1}
        onViewChange={onViewChange}
      />,
    )
    await user.click(screen.getByRole("button", { name: "Week" }))
    expect(onViewChange).toHaveBeenCalledWith("week")
    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true")
    const cells = screen.getAllByRole("gridcell")
    expect(cells).toHaveLength(7)
    expect(cells[0]).toHaveAccessibleName(/Monday, September 7, 2026/)
    expect(within(cell(/September 10, 2026/)).getByText("Launch post")).toBeInTheDocument()
  })

  it("offers no drag and no pick-up without onEntryMove, and opens an entry on Enter", async () => {
    const user = userEvent.setup()
    const onEntrySelect = vi.fn()
    draw(
      <BentoCalendar entries={ENTRIES} defaultDate="2026-09-15T12:00:00Z" timeZone={SAO_PAULO} onEntrySelect={onEntrySelect} />,
    )
    expect(entry("launch")).not.toHaveAttribute("draggable")
    expect(entry("launch")).not.toHaveAttribute("aria-pressed")

    act(() => cell(/September 10, 2026/).focus())
    await user.keyboard("{Enter}{Enter}")
    expect(onEntrySelect).toHaveBeenCalledWith("launch")
  })
})
