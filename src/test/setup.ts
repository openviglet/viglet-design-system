import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Testing Library's auto-cleanup only registers itself when globals are on; this
// suite runs with explicit imports, so unmount between tests here instead.
afterEach(() => {
  cleanup()
})

// jsdom implements neither of these, and components in this package read both:
// the reduced-motion guard the accessibility baseline requires, and the resize
// observation every Radix popper does on open.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
