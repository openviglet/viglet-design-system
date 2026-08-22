import { act, render, screen } from "@testing-library/react"
import i18next from "i18next"
import { useRef } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"

import { BentoScrollSaveBar } from "./bento-scroll-save-bar"
import { useBentoScrollFade } from "./bento-scroll-fade"

// The morph is the layer's most distinctive behaviour and the one a second
// console is most likely to hand-roll wrongly, so what is asserted here is the
// mechanic rather than the markup: a 0..1 progress written to a custom property
// on <html>, and — the part that makes it worth sharing at all — no React
// re-render while the page scrolls.

const STICKY_OFFSET = 80
const REVEAL_RANGE = 80

/** Place the sentinel at `top` px and fire a scroll frame. */
function scrollTo(top: number) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top,
    bottom: top + 1,
    left: 0,
    right: 0,
    width: 0,
    height: 1,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect)

  act(() => {
    window.dispatchEvent(new Event("scroll"))
    // The hook batches into requestAnimationFrame; jsdom runs it on a timer.
    vi.runOnlyPendingTimers()
  })
}

const fade = () => document.documentElement.style.getPropertyValue("--bento-fade")
const halfway = () => document.documentElement.classList.contains("bento-fade-half")

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

beforeEach(() => {
  vi.useFakeTimers()
  // jsdom has no rAF scheduler that advances on its own.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
    setTimeout(() => cb(0), 0) as unknown as number,
  )
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.documentElement.style.removeProperty("--bento-fade")
  document.documentElement.classList.remove("bento-fade-half")
})

function Harness({ onRender }: { onRender?: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useBentoScrollFade(ref)
  onRender?.()
  return <div ref={ref} data-testid="sentinel" />
}

describe("useBentoScrollFade", () => {
  it("writes 0 while the hero is still in full force", () => {
    scrollTo(STICKY_OFFSET + REVEAL_RANGE)
    render(<Harness />)

    expect(Number(fade())).toBe(0)
    expect(halfway()).toBe(false)
  })

  it("writes 1 once the sentinel reaches the sticky offset", () => {
    render(<Harness />)
    scrollTo(STICKY_OFFSET)

    expect(Number(fade())).toBe(1)
    expect(halfway()).toBe(true)
  })

  it("writes the midpoint halfway through the reveal range", () => {
    render(<Harness />)
    scrollTo(STICKY_OFFSET + REVEAL_RANGE / 2)

    expect(Number(fade())).toBeCloseTo(0.5, 5)
  })

  it("clamps rather than running past either end", () => {
    render(<Harness />)

    scrollTo(1000)
    expect(Number(fade())).toBe(0)

    scrollTo(-500)
    expect(Number(fade())).toBe(1)
  })

  it("does not re-render React while scrolling", () => {
    const onRender = vi.fn()
    render(<Harness onRender={onRender} />)
    const initial = onRender.mock.calls.length
    // The counter has to be wired, or "no further renders" is trivially true.
    expect(initial).toBeGreaterThan(0)

    scrollTo(140)
    scrollTo(120)
    scrollTo(100)
    scrollTo(STICKY_OFFSET)

    expect(Number(fade())).toBe(1)
    expect(onRender.mock.calls.length).toBe(initial)
  })

  it("collapses many scroll events into one frame", () => {
    render(<Harness />)
    const setProperty = vi.spyOn(document.documentElement.style, "setProperty")

    act(() => {
      for (let i = 0; i < 10; i++) window.dispatchEvent(new Event("scroll"))
      vi.runOnlyPendingTimers()
    })

    expect(setProperty.mock.calls.filter((c) => c[0] === "--bento-fade").length).toBe(1)
  })

  it("cleans the property off <html> on unmount, so it cannot leak to the next page", () => {
    const { unmount } = render(<Harness />)
    scrollTo(STICKY_OFFSET)
    expect(fade()).not.toBe("")

    unmount()

    expect(fade()).toBe("")
    expect(halfway()).toBe(false)
  })
})

describe("BentoScrollSaveBar", () => {
  const draw = (ui: React.ReactElement) =>
    render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)

  it("renders its own sentinel, spacer and fixed bar, so a page composes nothing", () => {
    const { container } = draw(<BentoScrollSaveBar onCancel={vi.fn()} />)

    expect(container.querySelector(".bento-save-bar-spacer")).toBeInTheDocument()
    expect(container.querySelector(".bento-fade-in")).toBeInTheDocument()
  })

  it("drives the same custom property the hero half reads", () => {
    draw(<BentoScrollSaveBar onCancel={vi.fn()} />)
    scrollTo(STICKY_OFFSET)

    expect(Number(fade())).toBe(1)
  })

  it("passes its props through to the bar it wraps", () => {
    draw(<BentoScrollSaveBar onCancel={vi.fn()} title="Connection" actions={<button>Publish</button>} />)

    expect(screen.getByText("Connection")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument()
  })
})
