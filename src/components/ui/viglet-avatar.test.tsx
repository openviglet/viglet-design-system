import { act, render } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VigletAvatar } from "./viglet-avatar"

// VDS100 — the mascot is drawn, not imported, and these hold the two halves of
// that claim: that it draws through a plain 2D context, and that nothing here
// reaches for a renderer to do it.
//
// jsdom implements no canvas at all — `getContext` returns null and logs through
// the virtual console, which the VDS55 console gate would then fail the run for.
// So the context is stubbed, and stubbing it is what lets the first claim be
// asserted rather than assumed: the recorder below is the only witness to what
// the component actually asked for.

interface Recorder {
  getContext: ReturnType<typeof vi.fn>
  calls: string[]
}

function stubCanvas(): Recorder {
  const calls: string[] = []
  const note =
    (name: string) =>
    (...args: unknown[]) => {
      calls.push(`${name}(${args.map(String).join(",")})`)
    }

  const context = {
    scale: note("scale"),
    clearRect: note("clearRect"),
    fillRect: note("fillRect"),
    beginPath: note("beginPath"),
    moveTo: note("moveTo"),
    lineTo: note("lineTo"),
    closePath: note("closePath"),
    fill: note("fill"),
    stroke: note("stroke"),
    arc: note("arc"),
    ellipse: note("ellipse"),
    save: note("save"),
    restore: note("restore"),
    createRadialGradient: () => ({ addColorStop: note("addColorStop") }),
    globalCompositeOperation: "source-over",
    globalAlpha: 1,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
  }

  const getContext = vi.fn((kind: string) => (kind === "2d" ? context : null))
  HTMLCanvasElement.prototype.getContext =
    getContext as unknown as HTMLCanvasElement["getContext"]

  return { getContext, calls }
}

/** jsdom's own, kept so `restoreMocks` is not the thing relied on to put it back. */
const realGetContext = HTMLCanvasElement.prototype.getContext
const realMatchMedia = window.matchMedia

function prefersReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
}

let recorder: Recorder

beforeEach(() => {
  recorder = stubCanvas()
  prefersReducedMotion(false)
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
  window.matchMedia = realMatchMedia
})

describe("VigletAvatar", () => {
  it("draws through a 2D context and asks for no other kind", () => {
    render(<VigletAvatar />)

    expect(recorder.getContext).toHaveBeenCalledWith("2d")
    const kinds = recorder.getContext.mock.calls.map(([kind]) => kind)
    expect(kinds.every((kind: string) => kind === "2d")).toBe(true)
  })

  it("draws the 180 facets of an icosahedron at three's detail 2, not 320", () => {
    render(<VigletAvatar />)

    // Every facet is one closePath and the cull drops the far hemisphere, so a
    // convex sphere puts about half of them on screen.
    //
    // The band is what this test is for. `IcosahedronGeometry(r, 2)` cuts each
    // edge into three, giving 9 triangles per base face and 180 in total;
    // subdividing recursively twice gives 16 per face and 320, which drew a
    // visibly finer ball than the design. 160 is above anything 180 can produce
    // and below half of 320, so either mistake fails here.
    const closed = recorder.calls.filter((call) => call.startsWith("closePath")).length
    expect(closed).toBeGreaterThan(60)
    expect(closed).toBeLessThan(160)
  })

  it("draws one frame and starts no loop when the reader asked for less motion", () => {
    prefersReducedMotion(true)
    const schedule = vi.spyOn(window, "requestAnimationFrame")

    render(<VigletAvatar />)

    expect(recorder.calls.some((call) => call.startsWith("clearRect"))).toBe(true)
    expect(schedule).not.toHaveBeenCalled()
  })

  it("keeps one loop across a state change instead of rebuilding the canvas", () => {
    // The whole reason the animated inputs are read through refs. A state change
    // is the moment the mascot is supposed to be moving; tearing the context
    // down and setting it up again is what that must not cost.
    const view = render(<VigletAvatar state="idle" />)
    expect(recorder.getContext).toHaveBeenCalledTimes(1)

    act(() => {
      view.rerender(<VigletAvatar state="success" />)
    })

    expect(recorder.getContext).toHaveBeenCalledTimes(1)
  })

  it("is decorative, and says which state it is drawing", () => {
    const { container } = render(<VigletAvatar state="attention" />)
    const canvas = container.querySelector("canvas")

    // The picture carries no words. The surface that wraps it owns the
    // accessible name, so a screen reader meets one control and not two.
    expect(canvas).toHaveAttribute("aria-hidden", "true")
    expect(canvas).not.toHaveAttribute("tabindex")
    expect(canvas).toHaveAttribute("data-state", "attention")
  })

  it("stops its loop and drops its listener when unmounted", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame")
    const drop = vi.spyOn(window, "removeEventListener")

    render(<VigletAvatar />).unmount()

    expect(cancel).toHaveBeenCalled()
    expect(drop).toHaveBeenCalledWith("mousemove", expect.any(Function))
  })

  it("renders with a context this package never got from a dependency", () => {
    // The criterion is about the bundle, so it is read off the manifest rather
    // than inferred from an import that a build could still pull in.
    const manifest = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../../../package.json"), "utf8"),
    ) as { dependencies: Record<string, string>; peerDependencies: Record<string, string> }

    expect(manifest.dependencies).not.toHaveProperty("three")
    expect(manifest.peerDependencies).not.toHaveProperty("three")
  })
})
