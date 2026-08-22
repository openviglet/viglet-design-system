import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import * as bento from "./index"
import {
  BentoActionsMenu,
  BentoBackLink,
  BentoCountTile,
  BentoEmptyState,
  BentoEntityTile,
  BentoFormSection,
  BentoHero,
  BentoSection,
  BentoStatusMarker,
  BentoTile,
} from "./index"

// Nine components crossed a repository boundary, and the promise made about
// them is that their props did not change — a page moves its imports and
// nothing else. Renders are the cheapest way to hold that: a prop quietly
// dropped in transit shows up here rather than in a product's screen.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function draw(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

describe("the subpath exports the nine leaves", () => {
  it.each([
    "BentoHero",
    "BentoBackLink",
    "BentoFormSection",
    "BentoTile",
    "BentoEntityTile",
    "BentoSection",
    "BentoCountTile",
    "BentoEmptyState",
    "BentoStatusMarker",
    "BentoActionsMenu",
  ])("%s", (name) => {
    expect(bento).toHaveProperty(name)
    expect(typeof (bento as Record<string, unknown>)[name]).toBe("function")
  })
})

describe("BentoHero", () => {
  it("renders its title, and an eyebrow that leads back", () => {
    draw(
      <BentoHero
        title="Language models"
        eyebrow={<BentoBackLink to="/llm">All models</BentoBackLink>}
        subtitle="Every model this install can reach."
      />,
    )

    expect(screen.getByText("Language models")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /All models/ })).toHaveAttribute("href", "/llm")
    expect(screen.getByText("Every model this install can reach.")).toBeInTheDocument()
  })
})

describe("BentoFormSection", () => {
  it("renders a titled section around its children with a tonal chip", () => {
    const { container } = draw(
      <BentoFormSection tone="violet" title="Connection" icon={IconCpu2}>
        <input aria-label="Endpoint" />
      </BentoFormSection>,
    )

    expect(screen.getByText("Connection")).toBeInTheDocument()
    expect(screen.getByLabelText("Endpoint")).toBeInTheDocument()
    expect(container.querySelector(".bento-tone-violet")).toBeInTheDocument()
  })
})

describe("BentoTile", () => {
  it("renders eyebrow, title and the span it was given", () => {
    const { container } = draw(
      <BentoTile
        tone="blue"
        eyebrow="Generative AI"
        title="Agents"
        span="col-span-2"
        icon={IconCpu2}
        to="/agents"
      />,
    )

    expect(screen.getByText("Generative AI")).toBeInTheDocument()
    expect(screen.getByText("Agents")).toBeInTheDocument()
    expect(container.querySelector(".col-span-2")).toBeInTheDocument()
    expect(container.querySelector(".bento-tone-blue")).toBeInTheDocument()
  })
})

describe("BentoEntityTile", () => {
  it("links to the entity and sizes itself from the emphasis", () => {
    const { container } = draw(
      <BentoEntityTile
        to="/llm/1"
        emphasis="LARGE"
        defaultIcon={IconCpu2}
        title="GPT"
        description="A model"
      />,
    )

    expect(screen.getByRole("link", { name: /GPT/ })).toHaveAttribute("href", "/llm/1")
    expect(container.querySelector(".row-span-2")).toBeInTheDocument()
  })

  it("shows the status pill only when asked, and marks enabled as on", () => {
    const { container, rerender } = draw(
      <BentoEntityTile to="/a" defaultIcon={IconCpu2} title="Off" hasStatus enabled={0} />,
    )
    expect(container.querySelector(".bento-status-on")).not.toBeInTheDocument()

    rerender(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoEntityTile to="/a" defaultIcon={IconCpu2} title="On" hasStatus enabled={1} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    expect(container.querySelector(".bento-status-on")).toBeInTheDocument()
  })

  it("falls back to MEDIUM when neither emphasis nor featured is given", () => {
    const { container } = draw(
      <BentoEntityTile to="/a" defaultIcon={IconCpu2} title="Plain" />,
    )

    expect(container.querySelector(".row-span-1")).toBeInTheDocument()
  })
})

describe("BentoSection", () => {
  it("renders a heading over its children", () => {
    draw(
      <BentoSection title="Indexing">
        <p>Body</p>
      </BentoSection>,
    )

    expect(screen.getByText("Indexing")).toBeInTheDocument()
    expect(screen.getByText("Body")).toBeInTheDocument()
  })
})

describe("BentoCountTile", () => {
  it("renders the label and the count", () => {
    draw(
      <BentoCountTile
        tone="emerald"
        label="Documents"
        count={1234}
        span="col-span-1"
        icon={IconCpu2}
        to="/docs"
      />,
    )

    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.getByText(/1[.,]?234/)).toBeInTheDocument()
  })
})

describe("BentoEmptyState", () => {
  it("renders its title and an action", () => {
    draw(<BentoEmptyState title="Nothing here" action={<button>Create</button>} />)

    expect(screen.getByText("Nothing here")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument()
  })
})

describe("BentoStatusMarker", () => {
  it("renders nothing when neither condition holds", () => {
    const { container } = draw(<BentoStatusMarker />)

    expect(container.querySelector(".bento-status")).not.toBeInTheDocument()
  })

  it("marks a missing title as an error, which outranks dirty", () => {
    const { container } = draw(<BentoStatusMarker titleMissing dirty />)

    expect(container.querySelector(".bento-status-error")).toBeInTheDocument()
    expect(container.querySelector(".bento-status-warn")).not.toBeInTheDocument()
  })

  it("marks unsaved changes as a warning", () => {
    const { container } = draw(<BentoStatusMarker dirty />)

    expect(container.querySelector(".bento-status-warn")).toBeInTheDocument()
  })
})

describe("BentoActionsMenu", () => {
  it("opens and calls the action that was selected", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    draw(
      <BentoActionsMenu
        actions={[
          { label: "Duplicate", icon: IconCpu2, onSelect: vi.fn() },
          { label: "Delete", icon: IconCpu2, onSelect, tone: "destructive" },
        ]}
      />,
    )

    await user.click(screen.getAllByRole("button")[0])
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByText("Delete"))

    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it("marks a destructive action so it reads as one", async () => {
    const user = userEvent.setup()

    draw(<BentoActionsMenu actions={[{ label: "Delete", icon: IconCpu2, onSelect: vi.fn(), tone: "destructive" }]} />)

    await user.click(screen.getAllByRole("button")[0])
    const item = within(await screen.findByRole("menu")).getByText("Delete")

    expect(item.closest(".bento-item-danger")).toBeInTheDocument()
  })
})

// Ported from the product's suite.
describe("BentoEmptyState, ported cases", () => {
  it("carries the frosted bento surface, so an empty list still reads as bento", () => {
    const { container } = draw(<BentoEmptyState title="Nothing here" />)

    expect(container.querySelector(".bento-glass")).toBeInTheDocument()
    expect(container.querySelector(".bento-tile")).toBeInTheDocument()
  })

  it("aligns left when asked, for an empty state that sits inside a mosaic", () => {
    const { container } = draw(<BentoEmptyState title="Nothing here" align="start" />)

    expect(container.querySelector(".items-start")).toBeInTheDocument()
  })
})
