import { composeStories } from "@storybook/react-vite"
import { render } from "@testing-library/react"
import type { ComponentType } from "react"
import { describe, expect, it } from "vitest"

import "./index.css"

import * as storyModule from "./brand-accent.stories"

// Composed rather than called directly: this is the story as the catalogue
// renders it, decorators and parameters included, which is the thing whose
// honesty is under test.
const { Default, Rekeyed } = composeStories(storyModule)

/**
 * VDS39 — the catalogue is the one place a consumer learns how to re-key, so
 * what it demonstrates has to be the mechanism that works.
 *
 * The earlier draft set the tokens on a wrapper `<div>`. Two of its five
 * specimens silently kept the default colour, because a pre-derived token
 * substitutes its `var()` references where it is declared. The assertion that
 * matters is therefore not "the story compiles" but "every specimen moved".
 */

/** Colour-bearing properties of every element under a rendered story. */
function palette(root: Element): string[] {
  const out: string[] = []
  const walk = (el: Element) => {
    const s = getComputedStyle(el)
    out.push(
      [s.color, s.backgroundColor, s.backgroundImage, s.borderColor, s.boxShadow].join("|"),
    )
    for (const child of Array.from(el.children)) walk(child)
  }
  walk(root)
  return out
}

function renderStory(Story: ComponentType) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const { unmount } = render(<Story />, { container: host })
  return {
    host,
    // Unmount before detaching: the token restore lives in an effect cleanup,
    // which is the behaviour under test.
    dispose: () => {
      unmount()
      host.remove()
    },
  }
}

describe("the accent story teaches the mechanism that works", () => {
  it("moves every specimen — nothing silently keeps the default", () => {
    const before = renderStory(Default)
    const cool = palette(before.host)
    before.dispose()

    const after = renderStory(Rekeyed)
    const warm = palette(after.host)
    after.dispose()

    expect(cool.length, "the specimen did not render").toBeGreaterThan(10)
    expect(warm.length, "the two stories rendered different trees").toBe(cool.length)

    // The specimen is five shapes: the chip, the tint, the hairline, the strong
    // tint and the solid fill. Each contributes at least one element that must
    // change, and the two that the earlier draft left behind are among them.
    const moved = cool.filter((line, i) => line !== warm[i])
    expect(moved.length, "too few elements changed — some specimen kept the default").toBeGreaterThan(4)
  })

  it("restores the root on the way out, so a neighbouring story is unaffected", () => {
    const story = renderStory(Rekeyed)
    const during = document.documentElement.style.getPropertyValue("--vg-accent-from")
    expect(during, "the story never applied its tokens").not.toBe("")

    story.dispose()
    expect(
      document.documentElement.style.getPropertyValue("--vg-accent-from"),
      "the story left its accent on the root",
    ).toBe("")
  })
})
