import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { BadgeLocale } from "./badge-locale"

// The fallback state was rewritten from "a flag failed" to "which flag failed",
// which removed the effect that used to clear it. The behaviour that has to
// survive is the clearing itself: a locale change must go back to trying the
// flag, and it must do so on the first render rather than one commit later.

const flag = () => screen.queryByRole("img")
const fallback = (container: HTMLElement) =>
  container.querySelector("svg.lucide-globe") ?? container.querySelector("svg")

describe("BadgeLocale", () => {
  it("renders the locale text and a flag for it", () => {
    render(<BadgeLocale locale="pt_BR" />)

    expect(screen.getByText("pt_BR")).toBeInTheDocument()
    expect(flag()).toHaveAttribute("src", expect.stringContaining("/br.png"))
  })

  it("falls back to the globe when the flag fails to load", () => {
    const { container } = render(<BadgeLocale locale="pt_BR" />)

    fireEvent.error(flag()!)

    expect(flag()).not.toBeInTheDocument()
    expect(fallback(container)).toBeInTheDocument()
  })

  it("tries again for a different locale, in the same render", () => {
    const { rerender } = render(<BadgeLocale locale="pt_BR" />)
    fireEvent.error(flag()!)
    expect(flag()).not.toBeInTheDocument()

    rerender(<BadgeLocale locale="en_US" />)

    expect(flag()).toHaveAttribute("src", expect.stringContaining("/us.png"))
  })

  it("keeps the fallback when the locale changes back to the one that failed", () => {
    const { rerender } = render(<BadgeLocale locale="pt_BR" />)
    fireEvent.error(flag()!)

    rerender(<BadgeLocale locale="en_US" />)
    rerender(<BadgeLocale locale="pt_BR" />)

    expect(flag()).not.toBeInTheDocument()
  })
})
