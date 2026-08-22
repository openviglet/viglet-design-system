import { readFileSync, readdirSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const root = resolve(import.meta.dirname, "..")
const manifest = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8")) as {
  consumers: { id: string; name: string; package: string; entries: string[]; chrome: string }[]
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

  it("holds the render contract to every declared token set", () => {
    // VDS25 compared two token sets. A third consumer means a third set, and
    // the digest is where "one look" stops being an intention.
    const parity = readFileSync(join(root, "src", "bento", "render-parity.parity.test.tsx"), "utf8")
    const sets = parity.match(/^\s{2}[a-z]+: \{$/gm) ?? []
    expect(
      sets.length,
      "the parity digest compares fewer token sets than there are consumers",
    ).toBeGreaterThanOrEqual(manifest.consumers.length)
  })
})
