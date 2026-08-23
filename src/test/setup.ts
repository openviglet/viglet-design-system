import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import {
  assertNoUndeclaredConsoleErrors,
  installConsoleErrorGate,
} from "./console-error-gate"

// VDS55 — the console gate, which VDS53 gave to the catalogue and not to this
// project. Installed at module scope so the patch is in place before the first
// render, and asserted per test: jsdom renders inside `act()`, so unlike the
// story project the error lands in the test that caused it. A test that means to
// log one calls `expectConsoleErrors()`.
installConsoleErrorGate()

// Testing Library's auto-cleanup only registers itself when globals are on; this
// suite runs with explicit imports, so unmount between tests here instead.
// Unmount first: an effect cleanup that logs belongs to the test being torn down.
afterEach(async () => {
  cleanup()
  await assertNoUndeclaredConsoleErrors()
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

// jsdom implements no scrolling at all, and any component that keeps an active
// row in view calls this on every move — the command palette does.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// Radix sets pointer capture when it opens a menu, and jsdom implements none of
// the three calls. Without them the trigger's own handler throws before the menu
// mounts, so every dropdown in this package is unopenable in a unit test — which
// is why the entity shell's delete path had never been driven from one.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
