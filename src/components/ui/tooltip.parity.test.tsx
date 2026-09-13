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
 *
 * VDS157 — it reads the clock rather than sleeping against it. The wait used to
 * be a fixed 150ms sleep asserting the bubble was not up yet, sized for an idle
 * machine and run beside 159 other test files: it failed two of four full runs
 * and passed alone every time, so its red carried no information and a delay
 * that genuinely stopped reaching the tooltip would have printed the same line
 * everyone had learned to re-run.
 */

/** The delay under test, and the value the second reading is held below. */
const PROVIDER_DELAY = 600

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
 * Hover the trigger and time the bubble, from two clocks.
 *
 * Radix starts its timer on the pointer entering, which is somewhere inside
 * `hover()`, so neither clock is that instant and each errs one way: `sinceRender`
 * starts before the pointer moves and can only over-count the wait, `sinceHover`
 * starts once the pointer has landed and can only under-count it. A test then
 * takes whichever clock errs *away* from its own assertion, which is what makes
 * a loaded machine unable to turn either one red.
 *
 * The pointer always moves away and the tree always unmounts: a pointer left
 * resting where the next test's trigger renders sends no move, and that test
 * would fail for this one's reason.
 */
async function timeToBubble(ui: React.ReactElement) {
  const { getByText, unmount } = render(ui)
  const trigger = getByText("Home")
  const beforeHover = performance.now()
  try {
    await userEvent.hover(trigger)
    const afterHover = performance.now()
    // 10ms rather than the default 50: the poll's own step is dead time inside
    // `sinceHover`, and that reading is the one with an upper bound to meet.
    await expect.poll(bubbleShown, { interval: 10, timeout: 4000 }).toBe(true)
    const shown = performance.now()
    return { sinceRender: shown - beforeHover, sinceHover: shown - afterHover }
  } finally {
    await userEvent.unhover(trigger)
    unmount()
  }
}

describe("a tooltip's delay", () => {
  it("waits for the delay a provider above it sets", async () => {
    const { sinceRender } = await timeToBubble(
      <TooltipProvider delayDuration={PROVIDER_DELAY}>
        <Label />
      </TooltipProvider>,
    )

    // Read from before the pointer moved, so every cost the machine adds —
    // dispatching the hover, rendering, the poll's own step — falls inside the
    // window and can only push this number up. A busy machine cannot fail it;
    // the defect can, because a delay nothing reads opens the bubble at once and
    // leaves only the dispatch, tens of milliseconds against six hundred.
    expect(sinceRender).toBeGreaterThanOrEqual(PROVIDER_DELAY)
  })

  it("opens at once with no provider above it", async () => {
    const { sinceHover } = await timeToBubble(<Label />)

    // The mirror of the reading above, and so the other clock: from the moment
    // the pointer landed, so the scheduling that precedes it is outside the
    // window this one has to stay inside. The bound is the sibling's delay
    // rather than a number of its own — what would break this is a bare Tooltip
    // inheriting a delay, and Radix's own default is above it.
    expect(sinceHover).toBeLessThan(PROVIDER_DELAY)
  })
})
