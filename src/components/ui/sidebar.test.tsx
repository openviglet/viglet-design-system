import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { Sidebar, SidebarProvider, SidebarTrigger } from "./sidebar"

// VDS108 — `Sidebar` has two branches and they had drifted. The desktop one
// spreads its rest props onto a real div; the mobile one spread them onto
// `Sheet`, which is Radix's `Dialog.Root` and renders no element, so every
// attribute a consumer set was dropped the moment the viewport narrowed. The
// assertions below are deliberately the same for both branches: what keeps them
// from drifting again is that one list of expectations runs twice.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

const realMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = realMatchMedia
})

// `useIsMobile` reads a media query, so the viewport is what this stubs.
function viewport(mobile: boolean) {
  window.matchMedia = vi.fn().mockImplementation((media: string) => ({
    matches: mobile,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

const sidebar = (
  <Sidebar
    id="nav"
    data-testid="app-sidebar"
    aria-label="Main navigation"
    className="border-dashed"
  >
    <span>links</span>
  </Sidebar>
)

// On mobile the sheet is closed until something opens it, and the trigger is
// the only door the provider exposes.
async function openOnMobile() {
  viewport(true)
  draw(
    <SidebarProvider>
      <SidebarTrigger />
      {sidebar}
    </SidebarProvider>,
  )

  await userEvent.click(screen.getByRole("button"))
}

describe("Sidebar", () => {
  it("forwards id, data attributes, aria-label and className on desktop", () => {
    viewport(false)
    draw(<SidebarProvider>{sidebar}</SidebarProvider>)

    const node = screen.getByTestId("app-sidebar")

    expect(node).toHaveAttribute("id", "nav")
    expect(node).toHaveAttribute("aria-label", "Main navigation")
    expect(node).toHaveClass("border-dashed")
  })

  it("forwards the same props on mobile, where they used to be dropped", async () => {
    await openOnMobile()

    const node = screen.getByTestId("app-sidebar")

    expect(node).toHaveAttribute("id", "nav")
    expect(node).toHaveAttribute("aria-label", "Main navigation")
    expect(node).toHaveClass("border-dashed")
  })

  it("keeps its own classes and the mobile width beside the forwarded ones", async () => {
    await openOnMobile()

    const node = screen.getByTestId("app-sidebar")

    // Merged, not replaced: the consumer's class does not cost the sheet its own.
    expect(node).toHaveClass("bg-sidebar")
    expect(node.style.getPropertyValue("--sidebar-width")).not.toBe("")
  })

  it("still renders its children on mobile", async () => {
    await openOnMobile()

    expect(screen.getByText("links")).toBeInTheDocument()
  })

  it("forwards props on the collapsible=none branch too", () => {
    viewport(false)
    draw(
      <SidebarProvider>
        <Sidebar collapsible="none" id="nav" data-testid="app-sidebar">
          <span>links</span>
        </Sidebar>
      </SidebarProvider>,
    )

    expect(screen.getByTestId("app-sidebar")).toHaveAttribute("id", "nav")
  })
})
