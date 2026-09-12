import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./resizable"

/**
 * VDS126 — the handle's orientation rules named attributes the library does not
 * write.
 *
 * Every rule on the class list read `data-panel-group-orientation`, and the
 * grip's read `data-panel-group-direction` on top of that. Version 4 of
 * react-resizable-panels writes neither: it lays the group out with inline
 * styles and labels the separator for ARIA. So none of them fired, and the
 * reported symptom — a grip that never rotates — was the visible corner of a
 * drag target one pixel wide and sixteen tall in every vertical group.
 *
 * Measured rather than matched on classes, because a class list is not a layout:
 * the old selectors were all present on the element and did nothing. It runs in
 * a browser for the same reason — jsdom resolves no stylesheet and would hand
 * back the class name.
 *
 * Nothing rendered a vertical group until VDS119 made the catalogue's `Vertical`
 * story actually vertical, which is why this stood.
 */

function drawGroup(orientation: "horizontal" | "vertical") {
  const host = document.createElement("div")
  host.style.cssText = "height:300px;width:500px"
  document.body.appendChild(host)

  const { unmount } = render(
    <ResizablePanelGroup orientation={orientation}>
      <ResizablePanel defaultSize={50} overflowHidden>
        <div>one</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} overflowHidden>
        <div>two</div>
      </ResizablePanel>
    </ResizablePanelGroup>,
    { container: host },
  )

  const handle = host.querySelector<HTMLElement>('[data-slot="resizable-handle"]')!
  const grip = handle.querySelector<HTMLElement>(":scope > div")!
  const box = handle.getBoundingClientRect()
  const read = {
    aria: handle.getAttribute("aria-orientation"),
    width: Math.round(box.width),
    height: Math.round(box.height),
    // Tailwind 4 compiles `rotate-90` to the `rotate` property rather than
    // to a `transform` matrix, so that is what says whether the grip turned.
    rotate: getComputedStyle(grip).rotate,
  }
  unmount()
  host.remove()
  return read
}

describe("the resize handle follows the group it divides", () => {
  it("is labelled on the axis opposite the group's", () => {
    // The premise, and the hook the rules use. Neither data attribute the file
    // used to name is on this element at all.
    expect(drawGroup("horizontal").aria).toBe("vertical")
    expect(drawGroup("vertical").aria).toBe("horizontal")
  })

  it("spans the height of a horizontal group", () => {
    const { width, height, rotate } = drawGroup("horizontal")

    expect(width).toBe(1)
    expect(height).toBe(300)
    expect(rotate).toBe("none")
  })

  it("spans the width of a vertical one, rather than being a stub", () => {
    const { width, height } = drawGroup("vertical")

    // It was 1x16 — one pixel wide, and as tall as the grip inside it.
    expect(width).toBe(500)
    expect(height).toBe(1)
  })

  it("turns the grip in a vertical group", () => {
    expect(drawGroup("vertical").rotate).toBe("90deg")
  })
})
