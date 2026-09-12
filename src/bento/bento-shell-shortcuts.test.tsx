import { fireEvent, render, renderHook, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"

import { bentoShortcutKeys, type BentoShellShortcut } from "./bento-shell-shortcuts"
import {
  BENTO_SHELL_SHORTCUTS,
  BentoPaletteTrigger,
  BentoShortcutsDialog,
  useBentoShellShortcuts,
} from "./index"

// VDS149 — two products each wrote the palette binding, and they agreed on ⌘K
// and nothing else, under a guide listing a key one of them never bound. These
// hold the one set: what the hook binds, what it leaves to a field, and that the
// guide and the trigger say exactly what is bound.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

const draw = (ui: ReactElement) => render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)

const placed: Element[] = []

afterEach(() => {
  for (const el of placed.splice(0)) el.remove()
})

function bind(isMac = false, withGuide = true) {
  const onPalette = vi.fn()
  const onShortcuts = vi.fn()
  const hook = renderHook(() =>
    useBentoShellShortcuts({ onPalette, onShortcuts: withGuide ? onShortcuts : undefined, isMac }),
  )
  return { onPalette, onShortcuts, hook }
}

/** Dispatch a keydown on `target` and report whether the shell took it. */
function press(target: Element, init: KeyboardEventInit) {
  const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init })
  fireEvent(target, event)
  return event.defaultPrevented
}

function place<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}) {
  const el = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
  document.body.append(el)
  placed.push(el)
  return el
}

describe("useBentoShellShortcuts", () => {
  it("opens the palette on the platform's own chord and on a bare slash", () => {
    const { onPalette } = bind(false)

    expect(press(document.body, { key: "k", ctrlKey: true })).toBe(true)
    expect(press(document.body, { key: "/" })).toBe(true)
    expect(onPalette).toHaveBeenCalledTimes(2)
  })

  it("takes the chord from the modifier the hint shows, not the other one", () => {
    const pc = bind(false)
    press(document.body, { key: "k", metaKey: true })
    expect(pc.onPalette).not.toHaveBeenCalled()
    pc.hook.unmount()

    const mac = bind(true)
    press(document.body, { key: "k", ctrlKey: true })
    expect(mac.onPalette).not.toHaveBeenCalled()
    press(document.body, { key: "K", metaKey: true })
    expect(mac.onPalette).toHaveBeenCalledOnce()
  })

  it("opens the guide on a question mark", () => {
    const { onShortcuts, onPalette } = bind()

    expect(press(document.body, { key: "?", shiftKey: true })).toBe(true)
    expect(onShortcuts).toHaveBeenCalledOnce()
    expect(onPalette).not.toHaveBeenCalled()
  })

  it.each([
    ["an input", () => place("input")],
    ["a textarea", () => place("textarea")],
    ["a select", () => place("select")],
    ["a contenteditable", () => place("div", { contenteditable: "true" })],
    ["a node inside a contenteditable", () => place("div", { contenteditable: "" }).appendChild(document.createElement("p"))],
  ])("leaves a bare key typed into %s to the field", (_where, make) => {
    const { onPalette, onShortcuts } = bind()
    const field = make()

    expect(press(field, { key: "/" })).toBe(false)
    expect(press(field, { key: "?", shiftKey: true })).toBe(false)
    expect(onPalette).not.toHaveBeenCalled()
    expect(onShortcuts).not.toHaveBeenCalled()
  })

  it("answers a bare key under a contenteditable switched off", () => {
    const { onPalette } = bind()
    const inert = place("div", { contenteditable: "true" }).appendChild(document.createElement("div"))
    inert.setAttribute("contenteditable", "false")

    press(inert, { key: "/" })
    expect(onPalette).toHaveBeenCalledOnce()
  })

  it("takes the chord from inside a field, which it types nothing into", () => {
    const { onPalette } = bind()

    expect(press(place("input"), { key: "k", ctrlKey: true })).toBe(true)
    expect(onPalette).toHaveBeenCalledOnce()
  })

  it("leaves a chord an editor already handled", () => {
    const { onPalette } = bind()
    const editor = place("div", { contenteditable: "true" })
    editor.addEventListener("keydown", (event) => event.preventDefault())

    press(editor, { key: "k", ctrlKey: true })
    expect(onPalette).not.toHaveBeenCalled()
  })

  it("ignores a bare key under a modifier, but not under AltGr", () => {
    const { onPalette } = bind()

    press(document.body, { key: "/", ctrlKey: true })
    press(document.body, { key: "/", metaKey: true })
    press(document.body, { key: "/", altKey: true })
    expect(onPalette).not.toHaveBeenCalled()

    // AltGr reports Ctrl and Alt together; it is how some layouts type a slash.
    press(document.body, { key: "/", ctrlKey: true, altKey: true })
    expect(onPalette).toHaveBeenCalledOnce()
  })

  it("ignores a key held down or pressed mid-composition", () => {
    const { onPalette } = bind()

    press(document.body, { key: "k", ctrlKey: true, repeat: true })
    press(document.body, { key: "/", isComposing: true })
    expect(onPalette).not.toHaveBeenCalled()
  })

  it("leaves the question mark alone for a product with no guide", () => {
    bind(false, false)

    expect(press(document.body, { key: "?", shiftKey: true })).toBe(false)
  })

  it("calls the latest callbacks and lets go of the window on unmount", () => {
    const first = vi.fn()
    const latest = vi.fn()
    const { rerender, unmount } = renderHook(({ onPalette }) => useBentoShellShortcuts({ onPalette, isMac: false }), {
      initialProps: { onPalette: first },
    })

    rerender({ onPalette: latest })
    press(document.body, { key: "/" })
    expect(first).not.toHaveBeenCalled()
    expect(latest).toHaveBeenCalledOnce()

    unmount()
    expect(press(document.body, { key: "/" })).toBe(false)
  })
})

/** The keydown a binding describes, on the platform given. */
function eventFor(shortcut: BentoShellShortcut, isMac: boolean): KeyboardEventInit {
  if (!shortcut.mod) return { key: shortcut.key, shiftKey: shortcut.key === "?" }
  return isMac ? { key: shortcut.key, metaKey: true } : { key: shortcut.key, ctrlKey: true }
}

describe.each([false, true])("the guide and the binding on isMac=%s", (isMac) => {
  it("lists every binding the hook answers, under the action it performs, and nothing else", () => {
    const { onPalette, onShortcuts } = bind(isMac)
    const callbacks = { palette: onPalette, shortcuts: onShortcuts }

    draw(<BentoShortcutsDialog open onOpenChange={vi.fn()} isMac={isMac} />)
    const dialog = screen.getByRole("dialog")

    const actions = [...new Set(BENTO_SHELL_SHORTCUTS.map((shortcut) => shortcut.action))]
    for (const action of actions) {
      const row = dialog.querySelector(`[data-shortcut="${action}"]`)
      expect(row, `the guide has no row for ${action}`).not.toBeNull()
      const listed = Array.from(row!.querySelectorAll("kbd"), (kbd) => kbd.textContent)
      const bound = BENTO_SHELL_SHORTCUTS.filter((shortcut) => shortcut.action === action)
      expect(listed).toEqual(bound.flatMap((shortcut) => bentoShortcutKeys(shortcut, isMac)))

      for (const shortcut of bound) {
        callbacks[action].mockClear()
        press(document.body, eventFor(shortcut, isMac))
        expect(callbacks[action], `${listed.join(" ")} is listed but does not ${action}`).toHaveBeenCalledOnce()
      }
    }

    const globalRows = within(dialog).getAllByRole("listitem").filter((li) => actions.includes(li.dataset.shortcut as never))
    expect(globalRows).toHaveLength(actions.length)
  })
})

describe("BentoPaletteTrigger", () => {
  it("hints at the chord the hook binds on this platform", () => {
    const { unmount } = draw(<BentoPaletteTrigger onClick={vi.fn()} isMac={false} />)
    expect(screen.getByRole("button").querySelector("kbd")).toHaveTextContent("Ctrl K")
    expect(screen.getByRole("button")).toHaveAttribute("aria-keyshortcuts", "Control+K /")
    unmount()

    draw(<BentoPaletteTrigger onClick={vi.fn()} isMac />)
    expect(screen.getByRole("button").querySelector("kbd")).toHaveTextContent("⌘K")
    expect(screen.getByRole("button")).toHaveAttribute("aria-keyshortcuts", "Meta+K /")
  })

  it("keeps its word in the accessible name at every width, and opens the palette", async () => {
    const onClick = vi.fn()
    draw(<BentoPaletteTrigger onClick={onClick} isMac={false} />)

    await userEvent.setup().click(screen.getByRole("button", { name: "bento.palette.search" }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
