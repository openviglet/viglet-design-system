import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  MAX_INLINE_ASSET,
  TOLERANCE,
  assess,
  bentoEvidence,
  drift,
  oversizedAssets,
  selectorsIn,
  subpathLeakage,
} from "./check-size.mjs"

// VDS26/VDS42 — the three fixtures actually bundle at the end of
// `pnpm run build`, in about 1.6 s. What is asserted here is the judgement the
// script makes about what it measured, which is where it has been wrong: the
// detector a first draft matched on module paths, the cap, the resolution check
// that catches fonts degrading silently to system-ui, and the comparison that
// decides whether a number is a regression.

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

describe("the inlined-asset cap", () => {
  const blob = (bytes: number) => "base64," + "A".repeat(bytes)

  it("names the entry and the size of anything over the cap", () => {
    const found = oversizedAssets([chunk("entry.js", `const a="${blob(MAX_INLINE_ASSET + 1)}"`)])
    expect(found).toHaveLength(1)
    expect(found[0]).toContain("entry.js")
    expect(found[0]).toContain("inlined asset #1")
  })

  it("leaves an asset at the cap alone", () => {
    expect(oversizedAssets([chunk("entry.js", `const a="${blob(MAX_INLINE_ASSET)}"`)])).toEqual([])
  })

  it("counts blobs per chunk, so a second offender is still named", () => {
    const two = `const a="${blob(MAX_INLINE_ASSET + 1)}",b="${blob(MAX_INLINE_ASSET + 2)}"`
    expect(oversizedAssets([chunk("entry.js", two)])).toHaveLength(2)
  })

  it("ignores a CSS asset — a stylesheet's fonts are VDS41, not this cap", () => {
    expect(oversizedAssets([asset("entry.css", blob(MAX_INLINE_ASSET + 1))])).toEqual([])
  })

  it("sits above the logos the app switcher renders and below another 2096px one", () => {
    // The three rendered logos are 33-66 KB raw, so under 90 KB base64. The one
    // that reached the root barrel through `productLogos` was 1.24 MB.
    expect(MAX_INLINE_ASSET).toBeGreaterThan(90 * 1024)
    expect(MAX_INLINE_ASSET).toBeLessThan(1_200_000)
  })
})

describe("what one fixture is held to", () => {
  const bentoChunk = chunk("entry.js", 'const t="bento-tone-blue"')
  const fontCss = asset("entry.css", "@font-face{font-family:Inter Variable}")
  const plain = chunk("entry.js", "const x=1")

  it("refuses a root-only fixture that carries the layer", () => {
    const found = assess("root-only", { bentoExpected: false }, [bentoChunk])
    expect(found.join("\n")).toContain("never imported it")
  })

  it("refuses a bento fixture that carries nothing — that one is vacuous", () => {
    const found = assess("bento", { bentoExpected: true }, [plain])
    expect(found.join("\n")).toContain("measuring nothing")
  })

  it("refuses a fonts fixture whose faces did not resolve", () => {
    // The failure worth catching: fonts.css ships verbatim, so a resolution
    // change degrades silently to system-ui and is first seen in a screenshot.
    const found = assess("fonts", { bentoExpected: false, mustEmbedFonts: true }, [plain])
    expect(found.join("\n")).toContain("no @font-face resolved")
  })

  it("refuses faces returning to an entry that is not ./fonts", () => {
    const found = assess("root-only", { bentoExpected: false }, [fontCss])
    expect(found.join("\n")).toContain("back in an entry")
  })

  it("passes each fixture in the shape it is meant to have", () => {
    expect(assess("root-only", { bentoExpected: false }, [plain])).toEqual([])
    expect(assess("bento", { bentoExpected: true }, [bentoChunk])).toEqual([])
    expect(assess("fonts", { bentoExpected: false, mustEmbedFonts: true }, [fontCss])).toEqual([])
  })
})

describe("a subpath's rules staying behind its subpath", () => {
  const subpath = { "./floating-formulas-bg.css": ".ff-term{}.ff-bond{}.ff-bond-line{}.ff-atom{}.ff-orbit{}.ff-glow{}.ff-drift{}" }

  it("names the subpath and how much of it arrived", () => {
    const leaked = asset("entry.css", ".ff-term{}.ff-bond{}.ff-bond-line{}.ff-atom{}.ff-orbit{}.ff-glow{}.ff-drift{}")
    const found = subpathLeakage([leaked], subpath)

    expect(found).toHaveLength(1)
    expect(found[0]).toContain("./floating-formulas-bg.css")
    expect(found[0]).toContain("7 of its selectors")
  })

  it("tolerates a few names in common — that is coincidence, not a layer", () => {
    // Two stylesheets can each define `.sr-only`. A subpath arriving whole
    // looks nothing like that, so the threshold is what separates them.
    const overlap = asset("entry.css", ".ff-term{}.ff-bond{}")
    expect(subpathLeakage([overlap], subpath)).toEqual([])
  })

  it("says nothing about a bundle with no CSS", () => {
    expect(subpathLeakage([chunk("entry.js", "const x=1")], subpath)).toEqual([])
  })

  it("reads class selectors and not custom properties", () => {
    // `--vg-bento-*` and friends are tokens in the preset, which a root
    // consumer is supposed to carry. Counting them would fail every build.
    expect([...selectorsIn(":root{--vg-bento-tone-blue-from:red}")]).toEqual([])
    expect([...selectorsIn(".ff-term{color:red}")]).toEqual(["ff-term"])
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
