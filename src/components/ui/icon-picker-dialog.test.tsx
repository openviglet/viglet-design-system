import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { IconPickerDialog } from "./icon-picker-dialog"

// VDS61 — the grid used to show whichever response arrived last, which on a slow
// network is the search asked for first. The 350ms debounce reads like the guard
// against that and is not: it delays starting a request, never landing one. So
// these tests hold requests open and release them out of order, which is the
// only way the defect is visible at all.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

afterEach(() => {
  vi.unstubAllGlobals()
})

/** Stubs fetch, handing back a release fn per call instead of resolving. */
function heldFetch() {
  const releases: Array<(icons: string[]) => void> = []
  vi.stubGlobal(
    "fetch",
    vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          releases.push((icons) =>
            resolve({ ok: true, json: async () => ({ icons }) } as Response),
          )
        }),
    ),
  )
  return releases
}

/** The same, keeping every request's signal — VDS115 asserts on those. */
function heldFetchSignals() {
  const signals: Array<AbortSignal | undefined> = []
  vi.stubGlobal(
    "fetch",
    vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>(() => {
          signals.push(init?.signal ?? undefined)
        }),
    ),
  )
  return signals
}

function draw(props: Partial<React.ComponentProps<typeof IconPickerDialog>> = {}) {
  return render(
    <I18nextProvider i18n={i18next}>
      <IconPickerDialog open onOpenChange={vi.fn()} onSelect={vi.fn()} {...props} />
    </I18nextProvider>,
  )
}

describe("IconPickerDialog", () => {
  it("keeps the newer search when an older response arrives after it", async () => {
    const releases = heldFetch()
    const user = userEvent.setup()
    draw()

    const box = screen.getByRole("textbox")
    await user.type(box, "arr")
    await waitFor(() => expect(releases).toHaveLength(1), { timeout: 2000 })

    await user.type(box, "ow")
    await waitFor(() => expect(releases).toHaveLength(2), { timeout: 2000 })

    releases[1](["tabler:arrow-right"])
    await waitFor(() => expect(document.body.innerHTML).toContain("arrow-right"))

    // The first search, for "arr", finishing last.
    releases[0](["tabler:archive"])
    await new Promise((resolve) => setTimeout(resolve, 20))

    expect(document.body.innerHTML).not.toContain("archive")
    expect(document.body.innerHTML).toContain("arrow-right")
  })

  it("shows what a search finds", async () => {
    const releases = heldFetch()
    const user = userEvent.setup()
    draw()

    await user.type(screen.getByRole("textbox"), "arrow")
    await waitFor(() => expect(releases).toHaveLength(1), { timeout: 2000 })

    releases[0](["tabler:arrow-right"])

    await waitFor(() => expect(document.body.innerHTML).toContain("arrow-right"))
  })

  // The suggestion path needs no such guard, and this is why: `suggesting`
  // refuses a second run, and it stays true across a close because the dialog
  // closing unmounts `DialogContent` and not this component. Two runs cannot
  // overlap, so there is no ordering to get wrong.
  it("refuses a second suggestion run while the first is still out", async () => {
    heldFetch()
    const user = userEvent.setup()

    const suggestKeywords = vi
      .fn<() => Promise<string[]>>()
      .mockImplementation(() => new Promise(() => {}))

    draw({ title: "A model", suggestKeywords })

    const button = screen.getByRole("button", { name: /suggest/i })
    await user.click(button)
    await user.click(button)

    expect(suggestKeywords).toHaveBeenCalledTimes(1)
  })
  // VDS115 — the id guard above says which of two responses is current. It says
  // nothing about the reader having gone: the effect cleared its debounce timer
  // and nothing else, so a host unmounting the picker mid-route-change left a
  // request to a third-party API running to completion with its result
  // discarded. React 19 makes the late setState a no-op rather than a warning,
  // which is why the suite was quiet about it — the cost is the network call.
  it("aborts a search in flight when the picker unmounts", async () => {
    const signals = heldFetchSignals()
    const user = userEvent.setup()
    const { unmount } = draw()

    await user.type(screen.getByRole("textbox"), "arrow")
    await waitFor(() => expect(signals).toHaveLength(1), { timeout: 2000 })
    expect(signals[0]!.aborted).toBe(false)

    unmount()

    expect(signals[0]!.aborted).toBe(true)
  })

  it("aborts the suggestion pass's searches too", async () => {
    const signals = heldFetchSignals()
    const user = userEvent.setup()
    const suggestKeywords = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValue(["model", "brain"])

    const { unmount } = draw({ title: "A model", suggestKeywords })

    await user.click(screen.getByRole("button", { name: /suggest/i }))
    await waitFor(() => expect(signals).toHaveLength(1), { timeout: 2000 })

    unmount()

    expect(signals[0]!.aborted).toBe(true)
  })
})
