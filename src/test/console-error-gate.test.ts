import { render } from "@testing-library/react"
import { createElement } from "react"
import { describe, expect, it } from "vitest"

import {
  createConsoleErrorGate,
  expectConsoleErrors,
  formatConsoleArgs,
} from "./console-error-gate"

// The gate is shipped machinery: every other test in this project passes or
// fails through it. What it must catch is as much a decision as what it must let
// through, and both halves have to be held.
//
// The case that cannot live here is the gate failing a run: a test that logs an
// undeclared error fails its own file by construction. That half was established
// with a throwaway probe — three tests, the middle one logging — and the runner
// blamed the middle one exactly, which is what settled `afterEach` over the
// `afterAll` the story project needs.

describe("formatConsoleArgs", () => {
  it("fills React's format string, so the message names the defect", () => {
    const text = formatConsoleArgs([
      "Received `%s` for a non-boolean attribute `%s`.",
      true,
      "collapsible",
    ])

    expect(text).toBe("Received `true` for a non-boolean attribute `collapsible`.")
  })

  it("keeps arguments a format string has no placeholder for", () => {
    expect(formatConsoleArgs(["one %s", "two", "three"])).toBe("one two three")
  })

  it("leaves a placeholder standing when nothing was passed for it", () => {
    expect(formatConsoleArgs(["a %s and a %s", "value"])).toBe("a value and a %s")
  })

  it("joins plain arguments, reading an Error as its message", () => {
    expect(formatConsoleArgs(["failed:", new Error("boom")])).toBe("failed: boom")
  })
})

/**
 * Runs `body` against a gate of its own, with the live one cut out.
 *
 * A gate chains to whatever `console.error` it found when it installed, and in
 * this file that is the live gate watching this very test — so without the
 * no-op in the middle, every message written below would also be counted
 * against the test writing it.
 */
async function withIsolatedGate(
  body: (gate: ReturnType<typeof createConsoleErrorGate>) => Promise<void>,
): Promise<void> {
  const live = console.error
  console.error = () => {}
  const gate = createConsoleErrorGate()
  gate.install()
  try {
    await body(gate)
  } finally {
    console.error = live
  }
}

describe("createConsoleErrorGate", () => {
  it("throws for an error nothing declared, naming it", async () => {
    await withIsolatedGate(async (gate) => {
      console.error("something broke")
      await expect(gate.assert()).rejects.toThrow("something broke")
    })
  })

  it("stays silent for an error that was declared, by string or by pattern", async () => {
    await withIsolatedGate(async (gate) => {
      gate.allow(["declared by substring", /declared by \w+/])
      console.error("a message declared by substring")
      console.error("another declared by pattern")
      await expect(gate.assert()).resolves.toBeUndefined()
    })
  })

  it("clears both what it captured and what was declared, so nothing carries over", async () => {
    await withIsolatedGate(async (gate) => {
      gate.allow(["only for this round"])
      console.error("only for this round")
      await gate.assert()

      // Same text, no declaration this time: the allowance did not survive.
      console.error("only for this round")
      await expect(gate.assert()).rejects.toThrow("only for this round")
    })
  })
})

describe("expectConsoleErrors", () => {
  it("lets a test declare an error it means to produce", () => {
    expectConsoleErrors("deliberate, and declared")
    console.error("deliberate, and declared")
    // The assertion is this test passing: the live gate checks in afterEach, and
    // without the declaration above it would fail here.
  })

  it("catches a React error in jsdom, which is the case the gate exists for", () => {
    expectConsoleErrors(/non-boolean attribute/)

    // The same shape of defect VDS53 found in the catalogue: a prop React
    // refuses to put on a DOM node. Reaching the gate from jsdom is what VDS55
    // is about — the story project already covered the browser.
    render(createElement("div", { collapsible: true }))
  })
})
