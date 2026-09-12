import { composeStories } from "@storybook/react-vite"
import { render } from "@testing-library/react"
import type { ComponentType } from "react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"
import "./glass-card.css"

import * as storyModule from "./glass-card.stories"

/**
 * VDS114 — `color` and `colorDark` wrote `--glass-card-color` and
 * `--glass-card-color-dark`, and the stylesheet read neither: the light rule
 * took `--ff-color-rgb` from an ancestor and the dark one hardcoded a flat
 * black. Both props were inert, `WithAccentColor` was pixel-identical to
 * `Default`, and the doc comments promised a tint nothing could produce — which
 * is worse than no prop at all, because there is nothing to debug.
 *
 * So the assertion is the rendered shadow and not the inline property. jsdom
 * resolves no stylesheet, which is exactly how a prop can be documented, storied
 * and dead at once; this runs in the browser project for that reason.
 */

const { Default, WithAccentColor } = composeStories(storyModule)

function shadowOf(Story: ComponentType) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const { unmount } = render(<Story />, { container: host })
  const card = host.querySelector(".vig-glass-card")!
  const shadow = getComputedStyle(card).boxShadow
  unmount()
  host.remove()
  return shadow
}

describe("GlassCard's accent props reach the shadow", () => {
  it("renders WithAccentColor differently from Default", () => {
    const plain = shadowOf(Default)
    const accented = shadowOf(WithAccentColor)

    // Non-vacuous: a card with no shadow at all would also differ from nothing.
    expect(plain).toMatch(/rgb|rgba|color/)
    expect(accented).not.toBe(plain)
  })

  it("keeps the ancestor's palette when no colour is passed", () => {
    const host = document.createElement("div")
    // What `FloatingFormulasBg` sets, and what the light rule used to read
    // directly — still the default, now through `--glass-card-color`.
    host.style.setProperty("--ff-color-rgb", "244, 63, 94")
    document.body.appendChild(host)
    const { unmount } = render(<Default />, { container: host })

    const tinted = getComputedStyle(host.querySelector(".vig-glass-card")!).boxShadow
    unmount()
    host.remove()

    expect(tinted).not.toBe(shadowOf(Default))
  })
})
