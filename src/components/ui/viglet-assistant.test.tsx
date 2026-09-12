import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { VigletAssistant, type VigletAssistantReport } from "./viglet-assistant"

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

    expect(screen.getByRole("status")).toHaveTextContent(caption)
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

// VDS134 — reports are not chat. A product reporting publishes, failures and
// arrivals through the dock used to fake them as assistant messages.
describe("VigletAssistant reports", () => {
  const AT = new Date("2026-09-12T14:02:00Z")

  function report(overrides: Partial<VigletAssistantReport> = {}): VigletAssistantReport {
    return { id: "r1", role: "report", tone: "error", text: "Could not publish /q3-results.", at: AT, ...overrides }
  }

  it("renders a report apart from both chat roles, with its state and its time", () => {
    const { container } = render(
      <VigletAssistant
        defaultOpen
        onSend={() => {}}
        messages={[
          { id: "u", role: "user", text: "publish it" },
          { id: "a", role: "assistant", text: "Publishing now." },
          report(),
        ]}
      />,
    )

    const rows = Array.from(screen.getByRole("log").children)
    expect(rows.map((row) => row.getAttribute("data-kind"))).toEqual(["user", "assistant", "report"])

    const [user, assistant, reported] = rows
    // What a report says about itself, which neither chat bubble does.
    expect(reported).toHaveTextContent("assistant.error")
    expect(reported.querySelector("time")).toHaveAttribute("dateTime", AT.toISOString())
    expect(reported).toHaveTextContent("assistant.new")
    for (const bubble of [user, assistant]) {
      expect(bubble.querySelector("time")).toBeNull()
      expect(bubble).not.toHaveTextContent("assistant.error")
    }
    expect(container.querySelectorAll("[data-kind='report']")).toHaveLength(1)
  })

  it("offers each action as a named button, and no more than three", async () => {
    const user = userEvent.setup()
    const retry = vi.fn()
    const actions = ["Retry", "Open the page", "Show the log", "A fourth"].map((label) => ({
      label,
      onSelect: label === "Retry" ? retry : () => {},
    }))
    render(<VigletAssistant defaultOpen messages={[report({ actions })]} />)

    for (const label of ["Retry", "Open the page", "Show the log"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument()
    }
    expect(screen.queryByRole("button", { name: "A fourth" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Retry" }))
    expect(retry).toHaveBeenCalledOnce()
  })

  it("lists reports in a dock with no chat, and never opens a composer for one", () => {
    const { rerender } = render(<VigletAssistant messages={[]} />)
    rerender(<VigletAssistant messages={[report()]} />)

    // A report arriving does not open the dock.
    expect(screen.getByRole("button", { name: /assistant\.open/ })).toHaveAttribute("aria-expanded", "false")

    rerender(<VigletAssistant defaultOpen open messages={[report()]} />)
    expect(screen.getByRole("log")).toHaveTextContent("Could not publish /q3-results.")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("counts what is unread on the orb, and takes a count from the product", () => {
    const { rerender, container } = render(
      <VigletAssistant messages={[report(), report({ id: "r2", read: true }), report({ id: "r3" })]} />,
    )
    const orb = screen.getByRole("button", { name: /assistant\.open/ })
    expect(orb).toHaveAccessibleName("assistant.open, assistant.unreadCount")
    expect(orb.querySelector("span[aria-hidden='true']")).toHaveTextContent("2")

    rerender(<VigletAssistant unread={7} messages={[report()]} />)
    expect(container.querySelector("button span[aria-hidden='true']")).toHaveTextContent("7")

    rerender(<VigletAssistant messages={[report({ read: true })]} />)
    expect(screen.getByRole("button", { name: "assistant.open" })).toBeInTheDocument()
  })

  it("tells the product what was read when the dock opens, and what was dismissed", async () => {
    const user = userEvent.setup()
    const onRead = vi.fn()
    const onDismiss = vi.fn()
    render(
      <VigletAssistant
        onRead={onRead}
        onDismiss={onDismiss}
        messages={[report(), report({ id: "r2", read: true }), report({ id: "r3", tone: "success" })]}
      />,
    )

    expect(onRead).not.toHaveBeenCalled()
    await user.click(screen.getByRole("button", { name: /assistant\.open/ }))
    expect(onRead.mock.calls).toEqual([["r1"], ["r3"]])

    await user.click(screen.getAllByRole("button", { name: "assistant.dismiss" })[1])
    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("r2")
  })

  it("follows the newest unread report's tone and text when the product sets neither", () => {
    const messages = [
      report({ tone: "error" }),
      report({ id: "r2", tone: "success", text: "Published." }),
      report({ id: "r3", tone: "attention", text: "Already seen.", read: true }),
    ]
    const { rerender } = render(<VigletAssistant open={false} messages={messages} />)
    expect(screen.getByRole("status")).toHaveTextContent("Published.")

    rerender(<VigletAssistant open messages={messages} />)
    // The header's state label sits under "System state".
    expect(screen.getByText("assistant.state").nextElementSibling).toHaveTextContent("assistant.success")

    // Set by the product, both win.
    rerender(<VigletAssistant open state="working" caption={null} messages={messages} />)
    expect(screen.getByText("assistant.state").nextElementSibling).toHaveTextContent("assistant.working")
  })

  it("announces a report once: not again on a re-render, and not on opening or closing", async () => {
    const user = userEvent.setup()
    const first = report({ text: "Could not publish /q3-results." })
    const { rerender } = render(<VigletAssistant messages={[first]} />)

    // One live region in the dock, saying the report.
    expect(document.querySelectorAll("[aria-live]")).toHaveLength(1)
    const live = screen.getByRole("status")
    const said = live.firstChild
    expect(live).toHaveTextContent(first.text)

    // The same report again changes nothing a screen reader would hear.
    rerender(<VigletAssistant messages={[{ ...first }]} activity={3} />)
    expect(screen.getByRole("status")).toBe(live)
    expect(live.firstChild).toBe(said)

    // Opening and closing is not news either.
    await user.click(screen.getByRole("button", { name: /assistant\.open/ }))
    await user.click(screen.getByRole("button", { name: "assistant.collapse" }))
    expect(live).toHaveTextContent(first.text)
    expect(live.firstChild).toBe(said)

    // A second report is.
    const second = report({ id: "r2", tone: "success", text: "Published /q3-results." })
    rerender(<VigletAssistant messages={[first, second]} />)
    expect(live).toHaveTextContent(second.text)
  })
})
