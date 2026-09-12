import { readFileSync } from "node:fs"
import { gzipSync } from "node:zlib"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  MAX_INLINE_ASSET,
  TOLERANCE,
  assess,
  bentoEvidence,
  drift,
  i18nEvidence,
  oversizedAssets,
  selectorsIn,
  subpathLeakage,
  unicodeRanges,
  unreachableSubpathCss,
  wireBytes,
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

// VDS117 — the root barrel re-exported the i18n runtime, so a consumer taking
// `.` and no `./i18n` resolved two peer packages it never asked for and carried
// about 14 KB of translations it never read. Nothing in this script asserted
// otherwise, which is how it stayed true without anyone noticing.
describe("the i18n detector", () => {
  const PHRASE = "Alterar idioma"

  it("finds the peers only the runtime pulls", () => {
    const found = i18nEvidence([chunk("entry.js", 'import"i18next";')], PHRASE)
    expect(found.join(" | ")).toContain("imports i18next")

    const detector = i18nEvidence(
      [chunk("entry.js", 'import"i18next-browser-languagedetector";')],
      PHRASE,
    )
    expect(detector.join(" | ")).toContain("imports i18next-browser-languagedetector")
  })

  it("does not read react-i18next as i18next", () => {
    // Every component that draws a word calls useTranslation, so the root entry
    // reaches this one by design. Matching the substring would report each of
    // them and the check would be turned off within the week.
    expect(i18nEvidence([chunk("entry.js", 'import"react-i18next";')], PHRASE)).toEqual([])
  })

  it("finds the translations even where neither peer is named", () => {
    // The bigger half, and the one that survives a refactor reaching the bundle
    // some other way: the locale data itself.
    const found = i18nEvidence([chunk("entry.js", `const t={toggle:"${PHRASE}"}`)], PHRASE)
    expect(found.join(" | ")).toContain("carries the locale bundle")
  })

  it("says nothing about a bundle carrying neither", () => {
    expect(i18nEvidence([chunk("entry.js", "const x=1")], PHRASE)).toEqual([])
    expect(i18nEvidence([asset("entry.css", ".a{color:red}")], PHRASE)).toEqual([])
  })

  it("refuses a root-only fixture that carries it", () => {
    const found = assess(
      "root-only",
      { bentoExpected: false, i18nExpected: false },
      [chunk("entry.js", 'import"i18next";')],
      {},
      PHRASE,
    )
    expect(found.join(" | ")).toContain("never imported ./i18n")
  })

  it("leaves a fixture that never opted out alone", () => {
    expect(
      assess("bento", { bentoExpected: true }, [chunk("entry.js", 'const t="bento-tone-blue";import"i18next";')], {}, PHRASE),
    ).toEqual([])
  })
})

describe("working out which subpaths a consumer skips", () => {
  // The shape of the real exports map, trimmed to what the derivation reads.
  const exportsMap = {
    ".": { import: "./dist/index.es.js" },
    "./bento": { import: "./dist/bento.es.js" },
    "./bento.css": "./dist/bento.css",
    "./floating-formulas-bg": { import: "./dist/floating-formulas-bg.es.js" },
    "./floating-formulas-bg.css": "./dist/floating-formulas-bg.css",
    "./styles": "./dist/viglet-design-system.css",
    "./preset": "./dist/preset.css",
    "./fonts": "./dist/fonts.css",
  }
  const skipped = (modules: string[]) =>
    unreachableSubpathCss(exportsMap, modules).map((u) => u.subpath)

  it("asks about the code a consumer did not pull", () => {
    expect(skipped(["dist/index.es.js", "dist/floating-formulas-bg.es.js"])).toEqual([
      "./bento.css",
    ])
  })

  it("asks nothing of a consumer that pulled everything", () => {
    expect(
      skipped(["dist/index.es.js", "dist/floating-formulas-bg.es.js", "dist/bento.es.js"]),
    ).toEqual([])
  })

  it("widens on its own when a component leaves the root barrel", () => {
    // This is the whole point of deriving it. If FloatingFormulasBg stopped
    // being a root export, a root bundle would stop carrying its entry and the
    // gate would start requiring its rules out of ./styles — with nobody
    // editing a list, which is what VDS46 needed and did not have.
    expect(skipped(["dist/index.es.js"])).toEqual(["./bento.css", "./floating-formulas-bg.css"])
  })

  it("ignores a stylesheet with no code behind it", () => {
    // ./preset and ./fonts are not a component's rules, so "did the consumer
    // pull their code" is not a question about them.
    expect(skipped(["dist/index.es.js"])).not.toContain("./preset")
    expect(skipped(["dist/index.es.js"])).not.toContain("./fonts")
    expect(skipped(["dist/index.es.js"])).not.toContain("./styles")
  })

  it("reads the entry file, not the path a bundler happened to write", () => {
    // Module ids come back with the platform's separators and an absolute
    // prefix; only the file name is the identity.
    expect(skipped(["C:\\tmp\\x\\node_modules\\@viglet\\vds\\dist\\bento.es.js"])).not.toContain(
      "./bento.css",
    )
  })
})

describe("a subpath's rules staying behind its subpath", () => {
  // ./bento.css is the only stylesheet whose code a root consumer does not
  // carry; asking this of every subpath is what VDS46 undid.
  const subpath = { "./bento.css": ".bento-tile{}.bento-hero{}.bento-chip{}.bento-fade{}.bento-rail{}.bento-tone-blue{}.bento-section{}" }

  it("names the subpath and how much of it arrived", () => {
    const leaked = asset("entry.css", ".bento-tile{}.bento-hero{}.bento-chip{}.bento-fade{}.bento-rail{}.bento-tone-blue{}.bento-section{}")
    const found = subpathLeakage([leaked], subpath)

    expect(found).toHaveLength(1)
    expect(found[0]).toContain("./bento.css")
    expect(found[0]).toContain("7 of its selectors")
  })

  it("tolerates a few names in common — that is coincidence, not a layer", () => {
    // Two stylesheets can each define `.sr-only`. A subpath arriving whole
    // looks nothing like that, so the threshold is what separates them.
    const overlap = asset("entry.css", ".bento-tile{}.bento-hero{}")
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

  it("says nothing about the formulas background, which is root chrome", () => {
    // VDS46 — it has its own subpath *and* is exported from the root barrel,
    // rendered by Login and StartupFirst, so its rules belong in ./styles.
    // Asking the question of it took them out and left those two unstyled.
    const rootStyles = asset("entry.css", ".ff-term{}.ff-bond{}.ff-atom{}.ff-orbit{}.ff-glow{}.ff-drift{}")
    expect(subpathLeakage([rootStyles], subpath)).toEqual([])
  })
})

describe("reading a unicode-range", () => {
  const covers = (range: string, point: number) =>
    unicodeRanges(range).some(([from, to]) => point >= from && point <= to)

  it("reads a span", () => {
    expect(covers("U+0000-00FF", 0x41)).toBe(true)
    expect(covers("U+0000-00FF", 0x4e2d)).toBe(false)
  })

  it("reads a list, and a single point in it", () => {
    expect(covers("U+0100-024F, U+0259", 0x259)).toBe(true)
    expect(covers("U+0100-024F, U+0259", 0x260)).toBe(false)
  })

  it("reads the wildcard form", () => {
    // `U+04??` is how @fontsource spells a whole block.
    expect(covers("U+04??", 0x0410)).toBe(true)
    expect(covers("U+04??", 0x0500)).toBe(false)
  })

  it("puts the Portuguese accents in latin, not latin-ext", () => {
    // Why the probes are what they are: ç is Latin-1, so a Portuguese page
    // fetches the same subset an English one does.
    expect(covers("U+0000-00FF", "ç".codePointAt(0)!)).toBe(true)
    expect(covers("U+0100-024F", "ç".codePointAt(0)!)).toBe(false)
  })
})

describe("what a page fetches, against what the entry ships", () => {
  const face = (file: string, range?: string) =>
    `@font-face{font-family:X;src:url(./fonts/${file}) format('woff2');${range ? `unicode-range:${range};` : ""}}`

  const bundle = (bodies: string[], files: Record<string, string>) => [
    asset("entry.css", bodies.join("")),
    ...Object.entries(files).map(([f, content]) => asset(`fonts/${f}`, content)),
  ]

  it("counts the subsets a page asks for and skips the rest", () => {
    const chunks = bundle(
      [face("latin.woff2", "U+0000-00FF"), face("cyrillic.woff2", "U+0400-04FF")],
      { "latin.woff2": "L".repeat(4000), "cyrillic.woff2": "C".repeat(4000) },
    )
    const whole = chunks.reduce((n, c) => n + String(c.source).length, 0)
    const wire = wireBytes(chunks)!

    expect(wire).toBeGreaterThan(0)
    // The cyrillic face is skipped, so the figure is well under the whole.
    expect(wire).toBeLessThan(whole / 2)
  })

  it("keeps a face that declares no range — a browser always fetches it", () => {
    const chunks = bundle([face("all.woff2"), face("greek.woff2", "U+0370-03FF")], {
      "all.woff2": "A".repeat(4000),
      "greek.woff2": "G".repeat(4000),
    })
    const withAll = wireBytes(chunks)!
    const withoutAll = wireBytes(bundle([face("greek.woff2", "U+0370-03FF")], {
      "greek.woff2": "G".repeat(4000),
    }))!
    expect(withAll).toBeGreaterThan(withoutAll)
  })

  it("says nothing where nothing is subsetted", () => {
    // An entry with no unicode-range has no second number to record, and a
    // duplicate of the first would read as a measurement.
    expect(wireBytes([asset("entry.css", ".a{color:red}")])).toBeNull()
    expect(wireBytes([chunk("entry.js", "const x=1")])).toBeNull()
  })

  it("counts a face once — it is a chunk in the bundle as well as a url", () => {
    // A first version added every asset in one pass and the fetched faces in
    // another, and reported a wire figure larger than the whole.
    const chunks = bundle([face("latin.woff2", "U+0000-00FF")], {
      "latin.woff2": "L".repeat(4000),
    })
    const whole = chunks.reduce(
      (n, c) => n + gzipSync(Buffer.from(String(c.source))).byteLength,
      0,
    )
    expect(wireBytes(chunks)).toBe(whole)
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
