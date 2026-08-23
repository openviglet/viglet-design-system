import { act } from "@testing-library/react"
import type { ReactElement } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"

/**
 * VDS56 — renders one element and returns the DOM as of the **first commit**,
 * before any passive effect has run.
 *
 * Testing Library's `render` cannot show this. It wraps the render in `act()`,
 * which flushes effects before it returns, so a component that paints one thing
 * and corrects it in an effect looks identical to one that painted the right
 * thing outright. Tests written against `render` for exactly that distinction
 * passed against the defect they were meant to pin, which is how this exists.
 *
 * `flushSync` commits synchronously and schedules passive effects without
 * running them, so what is in the container when it returns is the first paint —
 * the frame a user actually sees before any correction lands.
 */
export function renderFirstPaint(element: ReactElement): {
  container: HTMLElement
  unmount: () => void
} {
  const container = document.createElement("div")
  document.body.append(container)

  let root: Root
  // createRoot itself is not the render; only the flushSync below commits.
  flushSync(() => {
    root = createRoot(container)
    root.render(element)
  })

  return {
    container,
    unmount: () => {
      // Unmount is the one part that should settle normally: act() here keeps
      // React from warning about an update outside it during teardown.
      act(() => root.unmount())
      container.remove()
    },
  }
}
