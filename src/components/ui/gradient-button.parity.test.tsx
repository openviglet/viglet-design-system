import { act, render } from "@testing-library/react"
import { useState } from "react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"

import { GradientButton } from "./gradient-button"

/**
 * VDS143 — busy is not disabled, measured where focus is real.
 *
 * jsdom leaves `document.activeElement` on a button that becomes disabled; a
 * browser moves it to the body, which is the defect: a keyboard reader presses
 * Save and loses their place as the result is announced. So the claim is tested
 * in a browser, first against a button that does disable, to show the
 * measurement sees the loss, then against `loading`.
 *
 * The loss is not synchronous. Since Chromium 153 the focus fixup waits for the
 * next rendering update, so straight after `act` the disabled button still holds
 * focus and the control reads no loss. Both readings are taken after two animation
 * frames, which a whole rendering update has run inside of: the control then sees
 * the loss, and `loading` keeps focus through the step that would have dropped it.
 */

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function SaveButton({ mode }: Readonly<{ mode: "disabled" | "loading" }>) {
  const [pending, setPending] = useState(false)
  return (
    <GradientButton
      type="button"
      onClick={() => setPending(true)}
      {...(mode === "disabled" ? { disabled: pending } : { loading: pending })}
    >
      Save
    </GradientButton>
  )
}

async function pressAndSettle(mode: "disabled" | "loading") {
  const { container, unmount } = render(<SaveButton mode={mode} />)
  const button = container.querySelector("button")!
  button.focus()
  expect(document.activeElement).toBe(button)
  await act(async () => button.click())
  await nextFrame()
  await nextFrame()
  const focused = document.activeElement
  unmount()
  return { button, focused }
}

describe("a pending button keeps focus", () => {
  it("measures the loss on a button that disables itself", async () => {
    const { button, focused } = await pressAndSettle("disabled")
    expect(focused).not.toBe(button)
  })

  it("keeps focus on a button that is loading", async () => {
    const { button, focused } = await pressAndSettle("loading")
    expect(focused).toBe(button)
  })
})
