import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoSplitPage } from "./index"

// VDS173 — the two-pane page shape: two regions side by side at desktop width,
// one pane and a labelled switch at phone width.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

function atPhoneWidth() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches: query.includes("max-width"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  )
}

const page = (props: Partial<Parameters<typeof BentoSplitPage>[0]> = {}) => (
  <BentoSplitPage
    primaryLabel="Post"
    secondaryLabel="Preview"
    primary={<input aria-label="Title" />}
    secondary={<p>The post as a reader sees it.</p>}
    {...props}
  />
)

describe("BentoSplitPage", () => {
  it("reads as two regions side by side, with a handle between them", () => {
    draw(page())
    expect(screen.getByRole("region", { name: "Post" })).toContainElement(screen.getByRole("textbox", { name: "Title" }))
    expect(screen.getByRole("region", { name: "Preview" })).toHaveTextContent("The post as a reader sees it.")
    expect(screen.getByRole("separator")).toBeInTheDocument()
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
  })

  function fakeStorage(getItem: (key: string) => string | null = () => null) {
    const storage = { getItem: vi.fn(getItem), setItem: vi.fn() }
    vi.spyOn(window, "localStorage", "get").mockReturnValue(storage as unknown as Storage)
    return storage
  }

  it("remembers the ratio under its key, and survives storage that throws", () => {
    const storage = fakeStorage()
    const { unmount } = draw(page({ storageKey: "post-editor" }))
    expect(storage.getItem.mock.calls.some(([key]) => key.includes("post-editor"))).toBe(true)
    unmount()

    fakeStorage(() => {
      throw new Error("blocked")
    })
    draw(page({ storageKey: "post-editor" }))
    expect(screen.getByRole("region", { name: "Preview" })).toBeInTheDocument()
  })

  it("touches no storage without a key", () => {
    const storage = fakeStorage()
    draw(page())
    expect(storage.getItem).not.toHaveBeenCalled()
  })

  it("becomes one pane with a labelled switch at phone width, keeping the other mounted", async () => {
    atPhoneWidth()
    const user = userEvent.setup()
    draw(page())

    const tabs = screen.getByRole("tablist", { name: "Show" })
    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["Post", "Preview"])
    expect(tabs).toBeInTheDocument()
    await user.type(screen.getByRole("textbox", { name: "Title" }), "Q3 results")

    await user.click(screen.getByRole("tab", { name: "Preview" }))
    expect(screen.getByRole("tabpanel", { name: "Preview" })).toHaveTextContent("The post as a reader sees it.")
    // The form is hidden, not gone, so what was typed is still there.
    await user.click(screen.getByRole("tab", { name: "Post" }))
    expect(screen.getByRole("textbox", { name: "Title" })).toHaveValue("Q3 results")
  })
})
