import { act, render } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { renderFirstPaint } from "@/test/first-paint"

import { FloatingFormulasBg } from "./floating-formulas-bg"

// VDS54 — the layout used to be seeded from Date.now() inside render, so the
// same props produced a different arrangement every mount and nothing that
// compares two renders could hold this component. These tests are that
// comparison: they exist to fail if the clock ever gets back in.

/** jsdom's default, restored between tests so density never leaks across them. */
const DEFAULT_WIDTH = 1024

function resizeTo(width: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true })
}

afterEach(() => {
  resizeTo(DEFAULT_WIDTH)
})

/** The rendered terms, in order, with the position each was placed at. */
function placements(container: HTMLElement): string[] {
  return [...container.querySelectorAll<HTMLElement>(".ff-term")].map(
    (el) => `${el.textContent}@${el.style.top},${el.style.left}`,
  )
}

describe("FloatingFormulasBg", () => {
  it("renders the same layout twice for the same props", () => {
    const first = render(<FloatingFormulasBg />)
    const before = placements(first.container)
    first.unmount()

    const second = render(<FloatingFormulasBg />)
    const after = placements(second.container)

    expect(before.length).toBeGreaterThan(0)
    expect(after).toEqual(before)
  })

  it("lays out differently for a different seed, and identically for the same one", () => {
    const a = render(<FloatingFormulasBg seed={1} />)
    const seedOne = placements(a.container)
    a.unmount()

    const b = render(<FloatingFormulasBg seed={2} />)
    const seedTwo = placements(b.container)
    b.unmount()

    const c = render(<FloatingFormulasBg seed={1} />)
    const seedOneAgain = placements(c.container)

    expect(seedTwo).not.toEqual(seedOne)
    expect(seedOneAgain).toEqual(seedOne)
  })

  it("takes the pool into account, so extra tokens change the arrangement", () => {
    const plain = render(<FloatingFormulasBg />)
    const withoutTokens = placements(plain.container)
    plain.unmount()

    const extra = render(<FloatingFormulasBg extraTokens={["Viglet Turing"]} />)
    const withTokens = placements(extra.container)

    expect(withTokens).not.toEqual(withoutTokens)
  })

  it("shuffles rather than sorting, so every term is drawn from the pool once", () => {
    const { container } = render(<FloatingFormulasBg itemCount={35} />)

    const terms = [...container.querySelectorAll(".ff-term")].map(
      (el) => el.textContent,
    )

    expect(terms.length).toBeGreaterThan(0)
    expect(new Set(terms).size).toBe(terms.length)
  })

  // VDS56 — density used to start at 1 and be corrected by an effect, so a
  // phone's first paint carried the whole backdrop before thinning to a quarter
  // of it. That is the composite this hook exists to avoid.
  it("thins the backdrop in the first painted frame at a phone width", () => {
    resizeTo(400)

    // Not `render`: that flushes effects before returning, so the corrected
    // second commit is all it can ever show. See renderFirstPaint.
    const { container, unmount } = renderFirstPaint(<FloatingFormulasBg itemCount={35} />)

    // 35 * 0.25 = 9. The effect version painted all 35 here and thinned after.
    expect(container.querySelectorAll(".ff-term").length).toBe(9)
    unmount()
  })

  it("carries the full backdrop on a desktop width", () => {
    resizeTo(1440)

    const { container } = render(<FloatingFormulasBg itemCount={35} />)

    expect(container.querySelectorAll(".ff-term").length).toBe(35)
  })

  it("follows the viewport when it changes", () => {
    resizeTo(1440)
    const { container } = render(<FloatingFormulasBg itemCount={35} />)
    expect(container.querySelectorAll(".ff-term").length).toBe(35)

    act(() => {
      resizeTo(400)
      window.dispatchEvent(new Event("resize"))
    })

    expect(container.querySelectorAll(".ff-term").length).toBe(9)
  })

  it("gives each bond node a distinct key, including where a path revisits a point", () => {
    // The path in BONDS[0] returns to M40,20 three times. Keyed by coordinate,
    // as it was, React refused the duplicates.
    const { container } = render(<FloatingFormulasBg />)

    expect(container.querySelectorAll(".ff-bond-node").length).toBeGreaterThan(0)
  })
})
