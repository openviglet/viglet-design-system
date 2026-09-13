import { render, screen } from "@testing-library/react"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { AdaptiveSectionCard } from "./index"

// The adapter used to render one form in two chromes, and what is left of it is
// one translation: the console's compound markup — a Header child and a Content
// child — read off and rendered as a frosted bento section. So what is asserted
// is that every part of that markup arrives, and that a section the adapter
// cannot read keeps its children anyway.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

/** The console's compound markup, unchanged from the era that wrote it. */
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

describe("compound markup, one chrome", () => {
  // VDS146 — there is no provider to render under any more. VDS145 had already
  // made bento the default, which is what left every provider in every consumer
  // declaring the value it would have got anyway.
  it("renders the frosted section, with the header read off the markup", () => {
    const { container } = draw(<SharedSection />)

    expect(container.querySelector(".bento-glass")).toBeInTheDocument()
    expect(screen.getByText("Connection")).toBeInTheDocument()
    expect(screen.getByText("Where to reach it")).toBeInTheDocument()
  })

  it("keeps the fields, and exactly one copy of them", () => {
    const { container } = draw(<SharedSection />)

    expect(container.querySelectorAll("#endpoint")).toHaveLength(1)
    expect(screen.getByLabelText("Endpoint")).toHaveValue("https://example.test")
  })

  // VDS111 — the class list was forwarded on the console branch only, so a form
  // styled through the wrapper lost that styling under the one chrome the
  // wrapper exists to hide. The branch it was dropped on is gone; what the
  // wrapper must still do is merge rather than replace.
  it("merges className onto the frosted surface rather than replacing it", () => {
    const { container } = draw(
      <AdaptiveSectionCard variant="violet" className="lg:col-span-2">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Connection" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )

    const frosted = container.querySelector(".bento-glass")
    expect(frosted).toHaveClass("lg:col-span-2")
    expect(frosted).toHaveClass("bento-tile")
  })

  it("maps the variant to a tone, including the two with no tone of their own", () => {
    const cyan = draw(
      <AdaptiveSectionCard variant="cyan">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Cyan" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )
    expect(cyan.container.querySelector(".bento-tone-blue")).toBeInTheDocument()
    cyan.unmount()

    const orange = draw(
      <AdaptiveSectionCard variant="orange">
        <AdaptiveSectionCard.Header icon={IconCpu2} title="Orange" />
        <AdaptiveSectionCard.Content>x</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )
    expect(orange.container.querySelector(".bento-tone-amber")).toBeInTheDocument()
  })

  it("accepts a static header as well as a collapsible one", () => {
    const { container } = draw(
      <AdaptiveSectionCard>
        <AdaptiveSectionCard.StaticHeader icon={IconCpu2} title="Fixed" />
        <AdaptiveSectionCard.Content>body</AdaptiveSectionCard.Content>
      </AdaptiveSectionCard>,
    )

    expect(container.querySelector(".bento-glass")).toBeInTheDocument()
    expect(screen.getByText("Fixed")).toBeInTheDocument()
  })

  it("keeps the children of a section whose header it cannot read", () => {
    // This used to fall through to the console card. There is no second chrome
    // to fall back to, and dropping the fields silently would be the failure
    // here that is hardest to notice — so the surface renders without a header.
    const { container } = draw(
      <AdaptiveSectionCard className="lg:col-span-2">
        <div>hand-rolled body</div>
      </AdaptiveSectionCard>,
    )

    expect(screen.getByText("hand-rolled body")).toBeInTheDocument()
    const frosted = container.querySelector(".bento-glass")
    expect(frosted).toBeInTheDocument()
    expect(frosted).toHaveClass("lg:col-span-2")
  })
})
