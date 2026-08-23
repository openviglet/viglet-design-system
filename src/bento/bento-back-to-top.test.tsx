import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { renderFirstPaint } from "@/test/first-paint"

import { BentoBackToTop } from "./bento-back-to-top"

// VDS56 — the button used to read window.scrollY into a useState an effect
// caught up, so it rendered hidden whatever the position was and popped in one
// commit later. That is invisible on a page opened at the top, which is why it
// survived; a page restored to a saved offset, or opened on an anchor, is where
// it shows. The first render is what these tests hold.

function scrollTo(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true })
}

afterEach(() => {
  scrollTo(0)
})

/** The button is always mounted; `opacity-0` is how it hides. */
const isRevealed = () => screen.getByRole("button").className.includes("opacity-100")

describe("BentoBackToTop", () => {
  it("is revealed in the first painted frame when the page is already scrolled", () => {
    scrollTo(1000)

    // Not `render`: that flushes effects before returning, so the corrected
    // second commit is all it can ever show. See renderFirstPaint.
    const { container, unmount } = renderFirstPaint(<BentoBackToTop />)

    const button = container.querySelector("button")
    expect(button?.className).toContain("opacity-100")
    unmount()
  })

  it("is hidden on the first render at the top of the page", () => {
    render(<BentoBackToTop />)

    expect(isRevealed()).toBe(false)
  })

  it("is hidden while the page is scrolled less than the threshold", () => {
    scrollTo(479)

    render(<BentoBackToTop />)

    expect(isRevealed()).toBe(false)
  })

  it("follows the scroll position in both directions", () => {
    render(<BentoBackToTop />)
    expect(isRevealed()).toBe(false)

    act(() => {
      scrollTo(1000)
      window.dispatchEvent(new Event("scroll"))
    })
    expect(isRevealed()).toBe(true)

    act(() => {
      scrollTo(0)
      window.dispatchEvent(new Event("scroll"))
    })
    expect(isRevealed()).toBe(false)
  })

  it("is taken out of the tab order while hidden", () => {
    render(<BentoBackToTop />)

    expect(screen.getByRole("button")).toHaveAttribute("tabindex", "-1")
  })
})
