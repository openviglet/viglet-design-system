import { render, screen } from "@testing-library/react"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement, ReactNode } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import {
  AdaptiveSectionCard,
  SectionCardChromeProvider,
  useSectionChrome,
} from "./index"

// The point is one form and two chromes. A product migrating behind a parallel
// route renders its largest forms in both eras at once, and the alternative to
// this adapter is forking them — two copies of real field logic, drifting. So
// what is asserted is that the *same* markup produces both, and that neither
// branch loses anything on the way.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

/** Written once. Rendered below in both chromes, unchanged. */
function SharedSection() {
  return (
    <AdaptiveSectionCard variant="violet">
      <AdaptiveSectionCard.Header icon={IconCpu2} title="Connection" description="Where to reach it" />
      <AdaptiveSectionCard.Content>
        <label htmlFor="endpoint">Endpoint</label>
        <input id="endpoint" defaultValue="https://example.test" />
      </AdaptiveSectionCard.Content>
    </AdaptiveSectionCard>
  )
}

const draw = (ui: ReactElement) => render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)

const inChrome = (chrome: "console" | "bento", children: ReactNode) =>
  draw(<SectionCardChromeProvider chrome={chrome}>{children}</SectionCardChromeProvider>)

describe("one form, two chromes", () => {
  it("renders the console card with no provider at all", () => {
    const { container } = draw(<SharedSection />)

    expect(screen.getByText("Connection")).toBeInTheDocument()
    expect(screen.getByLabelText("Endpoint")).toBeInTheDocument()
    expect(container.querySelector(".bento-glass")).not.toBeInTheDocument()
  })

  it("renders the console card under a console provider", () => {
    const { container } = inChrome("console", <SharedSection />)

    expect(container.querySelector(".bento-glass")).not.toBeInTheDocument()
  })

  it("renders the frosted section under a bento provider — same markup", () => {
    const { container } = inChrome("bento", <SharedSection />)

    expect(container.querySelector(".bento-glass")).toBeInTheDocument()
    expect(screen.getByText("Connection")).toBeInTheDocument()
    expect(screen.getByText("Where to reach it")).toBeInTheDocument()
  })

  it("keeps the fields, and exactly one copy of them, in either chrome", () => {
    const consoleRender = inChrome("console", <SharedSection />)
    expect(consoleRender.container.querySelectorAll("#endpoint")).toHaveLength(1)
    consoleRender.unmount()

    const bentoRender = inChrome("bento", <SharedSection />)
    expect(bentoRender.container.querySelectorAll("#endpoint")).toHaveLength(1)
    expect(screen.getByLabelText("Endpoint")).toHaveValue("https://example.test")
  })

  // VDS111 — the class list was forwarded on the console branch only, so a form
  // styled through the wrapper lost that styling under the one chrome the
  // wrapper exists to hide. Written as one node rendered twice for that reason:
  // asserting each branch separately is what let them differ.
  it("carries className through either chrome", () => {
    const styled = (
      <AdaptiveSectionCard variant="violet" className="lg:col-span-2">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Connection" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>
    )

    const consoleRender = inChrome("console", styled)
    expect(consoleRender.container.querySelector(".lg\\:col-span-2")).toBeInTheDocument()
    consoleRender.unmount()

    const bentoRender = inChrome("bento", styled)
    const frosted = bentoRender.container.querySelector(".bento-glass")
    // Merged onto the frosted surface, not instead of it.
    expect(frosted).toHaveClass("lg:col-span-2")
    expect(frosted).toHaveClass("bento-tile")
  })

  it("maps the variant to a tone, including the two with no tone of their own", () => {
    const cyan = inChrome(
      "bento",
      <AdaptiveSectionCard variant="cyan">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Cyan" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )
    expect(cyan.container.querySelector(".bento-tone-blue")).toBeInTheDocument()
    cyan.unmount()

    const orange = inChrome(
      "bento",
      <AdaptiveSectionCard variant="orange">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Orange" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )
    expect(orange.container.querySelector(".bento-tone-amber")).toBeInTheDocument()
  })

  it("accepts a static header as well as a collapsible one", () => {
    const { container } = inChrome(
      "bento",
      <AdaptiveSectionCard>
        <AdaptiveSectionCard.StaticHeader icon={IconCpu2} title="Fixed" />
        <AdaptiveSectionCard.Content>body</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )

    expect(container.querySelector(".bento-glass")).toBeInTheDocument()
    expect(screen.getByText("Fixed")).toBeInTheDocument()
  })

  it("falls back to the console card rather than dropping content it cannot read", () => {
    // A section built some other way has no header to lift, and losing its
    // fields silently would be the hardest failure here to notice.
    const { container } = inChrome(
      "bento",
      <AdaptiveSectionCard>
        <div>hand-rolled body</div>
      </AdaptiveSectionCard>,
    )

    expect(screen.getByText("hand-rolled body")).toBeInTheDocument()
    expect(container.querySelector(".bento-glass")).not.toBeInTheDocument()
  })
})

describe("useSectionChrome", () => {
  function Probe() {
    return <span data-testid="chrome">{useSectionChrome()}</span>
  }

  it("reports console when nothing declared one", () => {
    draw(<Probe />)

    expect(screen.getByTestId("chrome")).toHaveTextContent("console")
  })

  it("reports what the nearest provider declared", () => {
    inChrome("bento", <Probe />)

    expect(screen.getByTestId("chrome")).toHaveTextContent("bento")
  })

  it("lets an inner provider win, so one page can hold both", () => {
    inChrome(
      "bento",
      <SectionCardChromeProvider chrome="console">
        <Probe />
      </SectionCardChromeProvider>,
    )

    expect(screen.getByTestId("chrome")).toHaveTextContent("console")
  })
})
