import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useIsMobile } from "./use-mobile"

// This hook decides which layout three products render, and it was rewritten
// from a useState/useEffect pair to useSyncExternalStore. The behaviour that
// changed is the first render: the old form always said "not mobile" and
// corrected itself one commit later, which is a visible layout flash. That is
// the case worth pinning, along with the listener actually being released.

type Listener = () => void

let listeners: Set<Listener>
let matches: boolean
let removeSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  listeners = new Set()
  matches = false
  removeSpy = vi.fn((_: string, listener: Listener) => listeners.delete(listener))

  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      media,
      get matches() {
        return matches
      },
      addEventListener: (_: string, listener: Listener) => listeners.add(listener),
      removeEventListener: removeSpy,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function resize(next: boolean) {
  act(() => {
    matches = next
    for (const listener of listeners) listener()
  })
}

describe("useIsMobile", () => {
  it("reports the viewport on the very first render, with no correcting pass", () => {
    matches = true

    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(true)
  })

  it("reports false on a wide viewport", () => {
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)
  })

  it("follows the media query when it changes, in both directions", () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    resize(true)
    expect(result.current).toBe(true)

    resize(false)
    expect(result.current).toBe(false)
  })

  it("releases its listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile())
    expect(listeners.size).toBe(1)

    unmount()

    expect(removeSpy).toHaveBeenCalled()
    expect(listeners.size).toBe(0)
  })

  it("returns a boolean, never undefined", () => {
    const { result } = renderHook(() => useIsMobile())

    expect(typeof result.current).toBe("boolean")
  })
})
