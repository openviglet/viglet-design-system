import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"

import "@/styles/index.css"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

/**
 * VDS154 — a provider's delay reaches the tooltips under it.
 *
 * Each Tooltip used to mount a zero-delay provider of its own, the nearest one
 * and so the one Radix read, which left the nav rail's 200ms delay unread. A
 * delay is time, and hover is a pointer, so this runs in a browser with a real
 * pointer and reads when the bubble arrives.
 */

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const bubbleShown = () => document.querySelector("[data-slot='tooltip-content']") !== null

function Label() {
  return (
    <Tooltip>
      <TooltipTrigger>Home</TooltipTrigger>
      <TooltipContent>Go to the home page</TooltipContent>
    </Tooltip>
  )
}

/**
 * Hover the trigger, run the reading, and always move the pointer away and
 * unmount: a pointer left resting where the next test's trigger renders sends no
 * move, and that test would fail for this one's reason.
 */
async function hovering(ui: React.ReactElement, read: () => Promise<void>) {
  const { getByText, unmount } = render(ui)
  const trigger = getByText("Home")
  try {
    await userEvent.hover(trigger)
    await read()
  } finally {
    await userEvent.unhover(trigger)
    unmount()
  }
}

describe("a tooltip's delay", () => {
  it("waits for the delay a provider above it sets", async () => {
    await hovering(
      <TooltipProvider delayDuration={600}>
        <Label />
      </TooltipProvider>,
      async () => {
        await sleep(150)
        expect(bubbleShown()).toBe(false)
        await expect.poll(bubbleShown, { timeout: 2000 }).toBe(true)
      },
    )
  })

  it("opens at once with no provider above it", async () => {
    await hovering(<Label />, async () => {
      await expect.poll(bubbleShown, { timeout: 300 }).toBe(true)
    })
  })
})
