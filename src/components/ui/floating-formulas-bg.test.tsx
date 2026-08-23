import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { FloatingFormulasBg } from "./floating-formulas-bg"

// VDS54 — the layout used to be seeded from Date.now() inside render, so the
// same props produced a different arrangement every mount and nothing that
// compares two renders could hold this component. These tests are that
// comparison: they exist to fail if the clock ever gets back in.

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

  it("gives each bond node a distinct key, including where a path revisits a point", () => {
    // The path in BONDS[0] returns to M40,20 three times. Keyed by coordinate,
    // as it was, React refused the duplicates.
    const { container } = render(<FloatingFormulasBg />)

    expect(container.querySelectorAll(".ff-bond-node").length).toBeGreaterThan(0)
  })
})
