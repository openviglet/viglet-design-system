import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { TOLERANCE, bentoEvidence, drift } from "./check-size.mjs"

// VDS26 — the two bundles themselves take about a minute, so they run as a CI
// step (`pnpm run check:size`) rather than here. What is asserted here is the
// judgement the script makes about what it measured: the detector that a first
// draft got wrong, and the comparison that decides whether a number is a
// regression.

const chunk = (fileName: string, code: string) => ({ fileName, code, type: "chunk" as const })
const asset = (fileName: string, source: string) => ({ fileName, source, type: "asset" as const })

describe("the bento detector", () => {
  it("finds the layer by the class names it writes, not by module path", () => {
    // The exact failure that defeated the first draft: re-exported from the
    // root barrel, the layer is inlined into a shared chunk and no
    // bento-shaped path is left anywhere in a consumer's module graph.
    expect(bentoEvidence([chunk("assets/entry-abc123.js", 'const t="bento-tone-blue"')])).toEqual([
      "assets/entry-abc123.js: bento-tone-",
    ])
  })

  it("finds the layer's stylesheet by its selectors", () => {
    expect(bentoEvidence([asset("entry.css", ".bento-tone-blue{color:red}")])).toHaveLength(1)
  })

  it("does not count the tokens — they are the preset, not the layer", () => {
    // `--vg-bento-tone-*` ships with every other token and is about a kilobyte
    // of custom properties. Counting it would make a root-only consumer fail
    // for carrying the preset it is supposed to carry.
    const preset = asset("entry.css", ":root{--vg-bento-tone-blue-from:oklch(54.6% .245 262.881)}")
    expect(bentoEvidence([preset])).toEqual([])
  })

  it("does not count a name that merely contains the word", () => {
    expect(bentoEvidence([chunk("entry.js", 'const label="Bento layout preferences"')])).toEqual([])
  })

  it("says nothing about an empty bundle", () => {
    expect(bentoEvidence([])).toEqual([])
  })
})

describe("the drift comparison", () => {
  it("passes a measurement inside tolerance", () => {
    expect(drift("x", 102, 100, 0.05)).toBeNull()
  })

  it("reports growth and shrinkage alike", () => {
    // A fixture that suddenly got much smaller is as much a signal as one that
    // grew: it usually means the bundle stopped resolving something.
    expect(drift("x", 120, 100, 0.05)).toContain("+20.0%")
    expect(drift("x", 80, 100, 0.05)).toContain("-20.0%")
  })

  it("refuses to pass with no baseline rather than recording one silently", () => {
    expect(drift("x", 100, undefined)).toContain("--update")
  })

  it("keeps a tolerance smaller than the layer it guards", () => {
    // 10% of the root entry is more than the whole bento layer, so a looser
    // budget could not notice the thing it exists to notice.
    const baseline = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "size-budget.json"), "utf8"),
    )
    const slack = baseline["root-only"].gzip * TOLERANCE
    expect(slack).toBeLessThan(baseline.bento.gzip)
  })
})
