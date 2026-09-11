import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VigletAssistant } from "./viglet-assistant"

// VDS101 — the dock, and the backend it must not know.
//
// The avatar inside draws to a canvas jsdom does not implement, so the context is
// stubbed here for the same reason viglet-avatar.test.tsx stubs it: without one,
// jsdom logs through the virtual console and the VDS55 gate fails the run.

const realGetContext = HTMLCanvasElement.prototype.getContext

beforeEach(() => {
  const context = new Proxy(
    {},
    {
      get: (_, key) =>
        key === "createRadialGradient"
          ? () => ({ addColorStop: () => {} })
          : () => {},
      set: () => true,
    },
  )
  HTMLCanvasElement.prototype.getContext = (() =>
    context) as unknown as HTMLCanvasElement["getContext"]
})

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = realGetContext
})

/** i18next is not initialised in a unit test, so `t` returns the key. */
const KEY = {
  open: "assistant.open",
  collapse: "assistant.collapse",
  send: "assistant.send",
  placeholder: "assistant.placeholder",
  transcript: "assistant.transcript",
  thinking: "assistant.thinking",
  empty: "assistant.empty",
}

describe("VigletAssistant", () => {
  it("collapses to one control that names itself", () => {
    render(<VigletAssistant />)

    const orb = screen.getByRole("button", { name: KEY.open })
    expect(orb).toHaveAttribute("aria-expanded", "false")
    // The mascot is decorative, so the orb is one control and not a button
    // wrapped around a second announced thing.
    expect(orb.querySelector("canvas")).toHaveAttribute("aria-hidden", "true")
  })

  it("renders no composer at all when the product passes no onSend", async () => {
    // Chat off is the composer absent, not a disabled box somebody keeps
    // trying to type in.
    render(<VigletAssistant defaultOpen />)

    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: KEY.send })).not.toBeInTheDocument()
    expect(screen.queryByRole("log")).not.toBeInTheDocument()
  })

  it("opens into a transcript and a composer once onSend is given", () => {
    render(<VigletAssistant defaultOpen onSend={() => {}} />)

    expect(screen.getByRole("log", { name: KEY.transcript })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: KEY.placeholder })).toBeInTheDocument()
  })

  it("hands the product what was typed, and clears the draft", async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<VigletAssistant defaultOpen onSend={onSend} />)

    const box = screen.getByRole("textbox", { name: KEY.placeholder })
    await user.type(box, "how many pages are unpublished?")
    await user.click(screen.getByRole("button", { name: KEY.send }))

    expect(onSend).toHaveBeenCalledWith("how many pages are unpublished?")
    expect(box).toHaveValue("")
  })

  it("sends on Enter, and refuses to send whitespace", async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<VigletAssistant defaultOpen onSend={onSend} />)

    const box = screen.getByRole("textbox", { name: KEY.placeholder })
    await user.type(box, "   {Enter}")
    expect(onSend).not.toHaveBeenCalled()

    await user.clear(box)
    await user.type(box, "publish it{Enter}")
    expect(onSend).toHaveBeenCalledExactlyOnceWith("publish it")
  })

  it("locks the composer and says so while an answer is in flight", () => {
    render(<VigletAssistant defaultOpen busy onSend={() => {}} />)

    expect(screen.getByRole("textbox", { name: KEY.placeholder })).toBeDisabled()
    expect(screen.getByRole("button", { name: KEY.send })).toBeDisabled()
    expect(screen.getByRole("log")).toHaveAttribute("aria-busy", "true")
    expect(screen.getByText(KEY.thinking)).toBeInTheDocument()
  })

  it("offers the action an answer carries, and calls it", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <VigletAssistant
        defaultOpen
        onSend={() => {}}
        messages={[
          { id: "a", role: "assistant", text: "Try a shorter title.", action: { label: "Use it", onSelect } },
        ]}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Use it" }))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it("announces the caption in full while it is still being typed", () => {
    // The typing is decoration; the sentence is the content. A screen reader
    // gets the whole line at once rather than one letter at a time.
    const caption = "governanca published at 14:02."
    const { container } = render(<VigletAssistant caption={caption} />)

    const live = container.querySelector(".sr-only")
    expect(live).toHaveTextContent(caption)
    expect(container.querySelector("[aria-hidden='true']")).toBeTruthy()
  })

  it("can be driven from outside, and reports its own attempts to move", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(<VigletAssistant open={false} onOpenChange={onOpenChange} />)

    await user.click(screen.getByRole("button", { name: KEY.open }))

    expect(onOpenChange).toHaveBeenCalledWith(true)
    // Controlled: it stays shut until the product says otherwise.
    expect(screen.getByRole("button", { name: KEY.open })).toHaveAttribute("aria-expanded", "false")
  })

  it("holds no endpoint, model id or key", () => {
    // The criterion, read off the source rather than trusted. The design this
    // came from posts to an LLM API from the browser; a package six products
    // install cannot carry that, whatever the component signature promises.
    const source = readFileSync(
      resolve(import.meta.dirname, "./viglet-assistant.tsx"),
      "utf8",
    )

    expect(source).not.toMatch(/https?:\/\//)
    expect(source).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|axios/)
    expect(source).not.toMatch(/api[-_]?key|anthropic|openai|claude-|gpt-/i)
  })

  it("ships every word it says in both locales", () => {
    // VDS51 holds this across the package; asserted here too because a dock that
    // renders the key instead of the word is the failure a person sees first.
    const dir = resolve(import.meta.dirname, "../../i18n/locales")
    const locales = readdirSync(dir)
    expect(locales).toEqual(expect.arrayContaining(["en", "pt"]))

    const source = readFileSync(
      resolve(import.meta.dirname, "./viglet-assistant.tsx"),
      "utf8",
    )
    const asked = [...source.matchAll(/"(assistant\.[a-zA-Z]+)"/g)].map((m) => m[1])
    expect(asked.length).toBeGreaterThan(8)

    for (const locale of locales) {
      const bundle = JSON.parse(
        readFileSync(join(dir, locale, "assistant.json"), "utf8"),
      ) as { assistant: Record<string, string> }

      for (const key of new Set(asked)) {
        const leaf = key.slice("assistant.".length)
        expect(bundle.assistant[leaf], `${locale} is missing ${key}`).toBeTruthy()
      }
    }
  })
})
