import { readFileSync, readdirSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(import.meta.dirname, "..")
const manifest = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8")) as {
  consumers: {
    id: string
    name: string
    package: string
    // VDS122 — a third, and the reason the field exists rather than a boolean:
    // viglet-docs is Docusaurus, which takes neither `./router` nor `./vite`
    // and no root entry either.
    framework: "vite" | "next" | "docusaurus"
    chrome: string
    accent: string
    entries: string[]
  }[]
}

const NAMES = manifest.consumers.map((c) => c.name)

/**
 * VDS31 — Dumont is the third consumer.
 *
 * The roadmap named only two of the three consumers throughout while
 * `dumont-react` sat on the same 2026.3 line importing the same entries.
 * Nothing was wrong for Dumont
 * specifically; it was that no line accounted for it, so a claim about "one
 * look across products" was being checked against two of three, and the
 * deprecation notices told two consoles that a removal was waiting on them.
 *
 * The fix the design asked for was to widen the existing lines rather than add
 * a parallel set, and this is what makes that stick: a paragraph that names two
 * of the three consumers is naming a subset as though it were the whole, which
 * is how the omission happened the first time.
 */

/** Text files this package ships or publishes, where the prose is read. */
function textFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist") continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) textFiles(full, found)
    else if (/\.(tsx?|mjs|md)$/.test(entry.name)) found.push(full)
  }
  return found
}

const SCANNED = [
  ...textFiles(join(root, "src")),
  ...textFiles(join(root, "scripts")),
  join(root, "README.md"),
]

/**
 * A paragraph is the unit: a blank line in prose, and a run of `//` or ` *`
 * lines in code. Naming two consumers three paragraphs apart is not the defect
 * — naming two in one breath, where all three apply, is.
 */
function paragraphs(text: string): string[] {
  return text.split(/\r?\n\s*(?:\r?\n|\*\s*\r?\n|\/\/\s*\r?\n)/)
}

/**
 * Not every pair is an omission — "Turing is blue where Shio is orange" is a
 * viglet-ds-consumer-pair -- the pragma named in its own explanation
 * contrast between two products, and widening it to three would say less. So a
 * paragraph may opt out — with a reason, in the shape `check-duplicates`
 * already uses, because an unexplained exemption is how a real omission hides.
 */
const PAIR_PRAGMA = /viglet-ds-consumer-pair\s+--\s+\S/

describe("the consumer set is declared, not remembered", () => {
  it("names three consumers, each with a package and the entries it imports", () => {
    expect(manifest.consumers.length).toBeGreaterThanOrEqual(3)
    for (const c of manifest.consumers) {
      expect(c.id, "an id is missing").toBeTruthy()
      expect(c.name, `${c.id} has no display name`).toBeTruthy()
      expect(c.package, `${c.id} names no package`).toBeTruthy()
      expect(c.entries.length, `${c.id} imports nothing`).toBeGreaterThan(0)
      // Every entry a consumer names has to be a subpath this package exports.
      const exports = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).exports
      for (const entry of c.entries) {
        expect(exports[entry], `${c.id} imports ${entry}, which is not exported`).toBeDefined()
      }
    }
  })

  it("never names a subset of the consumers as though it were all of them", () => {
    const offenders: string[] = []

    for (const file of SCANNED) {
      const rel = relative(root, file).replaceAll("\\", "/")
      for (const paragraph of paragraphs(readFileSync(file, "utf8"))) {
        if (PAIR_PRAGMA.test(paragraph)) continue
        const named = NAMES.filter((n) => new RegExp(String.raw`\b${n}\b`).test(paragraph))
        if (named.length >= 2 && named.length < NAMES.length) {
          const missing = NAMES.filter((n) => !named.includes(n))
          offenders.push(
            `${rel}: names ${named.join(" + ")} but not ${missing.join(", ")}\n      ${paragraph.trim().split("\n")[0].slice(0, 90)}`,
          )
        }
      }
    }

    // Non-vacuous: the consumers are named somewhere, or this asserts nothing.
    const mentions = SCANNED.filter((f) =>
      NAMES.some((n) => new RegExp(String.raw`\b${n}\b`).test(readFileSync(f, "utf8"))),
    )
    expect(mentions.length, "no file names a consumer, so this scan proves nothing").toBeGreaterThan(2)

    expect(offenders, "widen the sentence rather than leaving a consumer out").toEqual([])
  })

  it("holds the render contract to every accent a consumer renders with", () => {
    // VDS25 compared two token sets and this counted them against the number of
    // consumers, which held while both numbers were three and stopped meaning
    // anything the moment they diverged.
    //
    // VDS73 measured it: not one of the six consumers overrides
    // `--vg-accent-from`. All six take the preset default, which is the `cool`
    // set. So `warm` and `green` are hues the digest proves the mechanism
    // against, not accents anybody ships, and a sixth consumer never implied a
    // sixth set. Counting sets against consumers was a category error.
    //
    // What is true, and what this asserts: every accent a consumer declares has
    // a set in the digest, so the day a product re-keys — which is the whole
    // point of VDS23 making the accent a token — the digest is required to
    // carry it. The floor of three keeps the mechanism proven across hues
    // rather than against the one colour everybody happens to use.
    const parity = readFileSync(join(root, "src", "bento", "render-parity.parity.test.tsx"), "utf8")
    const sets = (parity.match(/^\s{2}([a-z]+): \{$/gm) ?? []).map((m) => m.trim().replace(":", "").replace("{", "").trim())

    for (const accent of new Set(manifest.consumers.map((c) => c.accent))) {
      expect(
        sets,
        `a consumer renders with the "${accent}" accent and the parity digest has no such set`,
      ).toContain(accent)
    }

    expect(
      sets.length,
      "the digest proves the token mechanism across hues, and needs more than one",
    ).toBeGreaterThanOrEqual(3)
  })
})
