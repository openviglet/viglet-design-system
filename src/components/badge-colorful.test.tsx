import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BadgeColorful } from "./badge-colorful"

// VDS107 — `text` is an entity name the consumer's content supplies:
// `dialog.delete` hands it `usage.name`. It used to be rendered through
// `dangerouslySetInnerHTML` and, three lines later, interpolated into a
// `<style>` element as `.dark [title="${text}"]`. Both paths are gone, and what
// has to survive is that neither can come back: a name is characters on the
// page, never markup and never part of a selector.

const XSS = `<img src=x onerror="alert(1)">`
const BREAKOUT = `a"] { display: none } .dark [title="b`

describe("BadgeColorful", () => {
  it("renders the text as characters, not as markup", () => {
    const { container } = render(<BadgeColorful text={XSS} />)

    expect(screen.getByText(XSS)).toBeInTheDocument()
    expect(container.querySelector("img")).not.toBeInTheDocument()
  })

  it("renders no style element, so a name cannot escape a selector", () => {
    const { container } = render(<BadgeColorful text={BREAKOUT} />)

    expect(container.querySelector("style")).not.toBeInTheDocument()
    expect(screen.getByText(BREAKOUT)).toBeInTheDocument()
  })

  it("carries the hashed palette as custom properties on the badge", () => {
    render(<BadgeColorful text="marketing" />)

    const badge = screen.getByTitle("marketing")

    // Both halves ride on the element; `.vg-badge-colorful` picks one.
    expect(badge).toHaveClass("vg-badge-colorful")
    expect(badge.style.getPropertyValue("--badge-bg")).toMatch(/^hsl\(/)
    expect(badge.style.getPropertyValue("--badge-dark-bg")).toMatch(/^hsl\(/)
  })

  it("gives the same text the same colour, and different text a different one", () => {
    const { container } = render(
      <>
        <BadgeColorful text="marketing" className="first" />
        <BadgeColorful text="marketing" className="second" />
        <BadgeColorful text="engineering" className="third" />
      </>,
    )

    const bg = (klass: string) =>
      container
        .querySelector<HTMLElement>(`.${klass}`)!
        .style.getPropertyValue("--badge-bg")

    expect(bg("first")).toBe(bg("second"))
    expect(bg("third")).not.toBe(bg("first"))
  })

  it("still calls onClick with the href when there is one", () => {
    const onClick = vi.fn()
    render(
      <BadgeColorful text="documentation" href="/docs" onClick={onClick} />,
    )

    fireEvent.click(screen.getByTitle("documentation"))

    expect(onClick).toHaveBeenCalledWith("/docs")
  })

  it("renders nothing without text", () => {
    const { container } = render(<BadgeColorful text="" />)

    expect(container).toBeEmptyDOMElement()
  })
})
