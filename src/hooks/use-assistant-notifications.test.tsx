import { act, render, screen } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { Toaster, toast } from "sonner"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { useAssistantNotifications } from "./use-assistant-notifications"

// VDS102 — the mascot's state, read off the toasts rather than set beside them.
//
// These drive real sonner: the hook's whole claim is that it reads what the
// Toaster already holds, and a mocked store would assert nothing about that.

function Probe() {
  const { state, caption, activity } = useAssistantNotifications()
  return (
    <>
      <Toaster />
      <span data-testid="state">{state}</span>
      <span data-testid="caption">{caption ?? ""}</span>
      <span data-testid="activity">{activity}</span>
    </>
  )
}

const read = (id: string) => screen.getByTestId(id).textContent

/**
 * Raise a toast and let it land.
 *
 * `useSonner` defers every store update through a `setTimeout` before its
 * `flushSync`, so a synchronous `act` returns before the subscriber has run and
 * the probe still reads the previous frame. One macrotask is what the hook's own
 * implementation costs, not a guess at a duration.
 */
async function raise(fn: () => void) {
  await act(async () => {
    fn()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

/** sonner's store is module state, so a test that leaves a toast up poisons the next. */
afterEach(async () => {
  await raise(() => toast.dismiss())
})

/**
 * How long sonner keeps a dismissed toast mounted for its exit animation, read
 * from the build that runs rather than typed here.
 *
 * VDS164 — dismissing schedules the removal on a `setTimeout` of this length,
 * and nothing cancels it when the Toaster unmounts. Between tests that is
 * harmless: the timer lands on an unmounted component and React drops the
 * update. After the last test it is not, because the file's jsdom environment
 * is torn down while the worker lives on, and the timer then runs React's
 * update path with no `window` — `ReferenceError: window is not defined`,
 * reported as an unhandled error that fails the run with every assertion green.
 * That is what stopped a publish.
 */
const SONNER_EXIT_MS = (() => {
  const build = readFileSync(createRequire(import.meta.url).resolve("sonner"), "utf8")
  const found = /\bTIME_BEFORE_UNMOUNT\s*=\s*(\d+)/.exec(build)
  if (!found) {
    throw new Error(
      "sonner no longer declares TIME_BEFORE_UNMOUNT, so this file cannot tell how long a dismissed"
        + " toast's removal timer runs. Find the constant that replaced it and read that instead.",
    )
  }
  return Number(found[1])
})()

/**
 * Let the last dismissal's removal run while there is still a `window` for it
 * to run against. A timer scheduled after another with the same or a longer
 * delay fires after it, so waiting exactly the exit delay from here is enough.
 */
afterAll(async () => {
  await new Promise((resolve) => setTimeout(resolve, SONNER_EXIT_MS))
})

describe("useAssistantNotifications", () => {
  it("is idle when nothing is on screen", () => {
    render(<Probe />)
    expect(read("state")).toBe("idle")
    expect(read("caption")).toBe("")
  })

  it.each([
    ["success", "success"],
    ["error", "error"],
    ["warning", "attention"],
    ["info", "attention"],
    ["loading", "working"],
  ] as const)("maps a %s toast to %s", async (kind, expected) => {
    render(<Probe />)

    await raise(() => toast[kind]("something happened"))

    expect(read("state")).toBe(expected)
  })

  it("lifts the toast's title as the caption a dock can speak", async () => {
    render(<Probe />)

    await raise(() => toast.success("/q3-results published at 14:02."))

    expect(read("caption")).toBe("/q3-results published at 14:02.")
  })

  it("offers no caption for a toast rendered as markup", async () => {
    // There is no sentence to lift out of JSX, and inventing one would put the
    // package's words in a product's mouth.
    render(<Probe />)

    await raise(() => toast.success(<strong>done</strong>))

    expect(read("state")).toBe("success")
    expect(read("caption")).toBe("")
  })

  it("returns to idle when the toast is dismissed", async () => {
    // The list is the truth. A toast that leaves can never strand the mascot on
    // a state whose notification is gone.
    render(<Probe />)

    await raise(() => toast.error("could not save"))
    expect(read("state")).toBe("error")

    await raise(() => toast.dismiss())
    expect(read("state")).toBe("idle")
  })

  it("prefers work in progress over an outcome, and a failure over a success", async () => {
    render(<Probe />)

    await raise(() => {
      toast.success("saved")
      toast.error("could not publish")
    })
    // The failure is the one that still needs somebody.
    expect(read("state")).toBe("error")

    await raise(() => toast.loading("publishing"))
    // Work in progress outranks both: the outcomes have been read, this has not.
    expect(read("state")).toBe("working")
  })

  it("counts what is up, so each arrival is a fresh nudge", async () => {
    render(<Probe />)
    expect(read("activity")).toBe("0")

    await raise(() => toast.success("one"))
    expect(read("activity")).toBe("1")

    await raise(() => toast.success("two"))
    expect(read("activity")).toBe("2")
  })

  it("wraps nothing, so sonner called from anywhere still moves the mascot", () => {
    // The criterion, read off the source. A wrapper would work in a test that
    // imports this module and fail silently in the product module that does not.
    const source = readFileSync(
      resolve(import.meta.dirname, "./use-assistant-notifications.ts"),
      "utf8",
    )

    expect(source).toContain("useSonner")
    // No re-export of toast, no assignment over it, no patched method.
    expect(source).not.toMatch(/export\s+(const|function)?\s*toast\b/)
    expect(source).not.toMatch(/toast\s*\.\s*\w+\s*=|toast\s*=/)
  })
})
