import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoFormHero } from "./index"

// The point of this component is that one call renders both halves of the
// morph. Before it existed, every own-hero form hand-wired a fade-out control
// group and a scroll bar separately, and the two drifted. So the assertions are
// about both copies staying in step — including under the imperative escape
// hatch, which is exactly where a hand-wired version forgot the second half.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

const draw = (ui: ReactElement) =>
  render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )

describe("BentoFormHero", () => {
  it("renders both halves from a single call", () => {
    const { container } = draw(<BentoFormHero title="Settings" onCancel={vi.fn()} />)

    // The hero-anchored controls, which fade out as the page scrolls...
    expect(container.querySelector(".bento-fade-out")).toBeInTheDocument()
    // ...and the fixed bar that fades in, with its layout spacer.
    expect(container.querySelector(".bento-fade-in")).toBeInTheDocument()
    expect(container.querySelector(".bento-save-bar-spacer")).toBeInTheDocument()
  })

  it("renders exactly one of each half, so nothing is composed twice", () => {
    const { container } = draw(<BentoFormHero title="Settings" onCancel={vi.fn()} />)

    expect(container.querySelectorAll(".bento-fade-in")).toHaveLength(1)
    expect(container.querySelectorAll(".bento-save-bar-spacer")).toHaveLength(1)
  })

  it("puts the default Save and Cancel in both copies", () => {
    draw(<BentoFormHero title="Settings" onCancel={vi.fn()} dirty />)

    // One pair in the hero, one in the sticky bar — the morph swaps which is
    // visible, so both are in the tree at once by design.
    expect(screen.getAllByRole("button", { name: /save/i }).length).toBeGreaterThanOrEqual(2)
  })

  it("replaces the default pair in both copies when actions are given", () => {
    draw(
      <BentoFormHero
        title="Settings"
        onCancel={vi.fn()}
        actions={<button type="button">Apply</button>}
      />,
    )

    // The escape hatch has to reach both halves, or a form saves from the hero
    // and does nothing from the sticky bar.
    expect(screen.getAllByRole("button", { name: "Apply" })).toHaveLength(2)
    expect(screen.queryByRole("button", { name: /^save/i })).not.toBeInTheDocument()
  })

  it("submits the form it belongs to by default", () => {
    draw(<BentoFormHero title="Settings" onCancel={vi.fn()} dirty />)

    for (const button of screen.getAllByRole("button", { name: /save/i })) {
      expect(button).toHaveAttribute("type", "submit")
    }
  })

  it("cancels from either copy", async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    draw(<BentoFormHero title="Settings" onCancel={onCancel} dirty />)

    const cancels = screen.getAllByRole("button", { name: /cancel/i })
    expect(cancels.length).toBeGreaterThanOrEqual(2)

    await user.click(cancels[0])
    await user.click(cancels[1])

    expect(onCancel).toHaveBeenCalledTimes(2)
  })

  it("disables Save while there is nothing to save", () => {
    draw(<BentoFormHero title="Settings" onCancel={vi.fn()} />)

    for (const button of screen.getAllByRole("button", { name: /save/i })) {
      expect(button).toBeDisabled()
    }
  })

  it("disables Save while the title is missing, even when dirty", () => {
    draw(<BentoFormHero title="Settings" onCancel={vi.fn()} dirty titleMissing />)

    for (const button of screen.getAllByRole("button", { name: /save/i })) {
      expect(button).toBeDisabled()
    }
  })

  it("renders its own back-link breadcrumb when given a route", () => {
    draw(
      <BentoFormHero title="Settings" onCancel={vi.fn()} backTo="/admin" backLabel="Admin" />,
    )

    expect(screen.getByRole("link", { name: /Admin/ })).toHaveAttribute("href", "/admin")
  })

  it("gives the sticky bar its own title, so a scrolled page still says where it is", () => {
    draw(
      <BentoFormHero
        title="Global settings"
        stickyTitle="Settings"
        onCancel={vi.fn()}
        dirty
      />,
    )

    expect(screen.getByText("Global settings")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })
})

// Ported from the product's suite. Both are properties a hand-wired version
// lost: an explicit disable that the dirty flag would otherwise override, and a
// destructive action that must not fade away with the Save/Cancel pair.
describe("BentoFormHero, ported cases", () => {
  it("honours saveDisabled even when the form is dirty", () => {
    draw(<BentoFormHero title="Settings" onCancel={vi.fn()} dirty saveDisabled />)

    for (const button of screen.getAllByRole("button", { name: /save/i })) {
      expect(button).toBeDisabled()
    }
  })

  it("keeps caller trailing outside the fade-out group, so a delete stays put", () => {
    const { container } = draw(
      <BentoFormHero
        title="Settings"
        onCancel={vi.fn()}
        trailing={<button type="button">Delete</button>}
      />,
    )

    const fadeOut = container.querySelector(".bento-fade-out")
    const destructive = screen.getByRole("button", { name: "Delete" })

    // Inside the fade-out group it would vanish as the reader scrolls, which is
    // how a page loses its delete button halfway down.
    expect(fadeOut?.contains(destructive)).toBe(false)
  })
})
