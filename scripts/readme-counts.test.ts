import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// VDS245 — the README's consumer counts, compared with consumers.json.
//
// The names in the README's opening are guarded (consumers.test.ts refuses a
// paragraph that names a subset as the whole). The counts beside them were read
// by nothing: the opening said sixteen while the register held eighteen, and
// "four are Vite product sites" was followed by six names. Each consumer added
// left the numbers one further behind, so they are measured here instead.

const root = resolve(import.meta.dirname, "..")
const consumers = (JSON.parse(readFileSync(join(root, "consumers.json"), "utf8")) as { consumers: { name: string }[] }).consumers
const NAMES = consumers.map((c) => c.name)

const CARDINALS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five"]
const ORDINALS = ["zeroth", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second", "twenty-third", "twenty-fourth", "twenty-fifth"]

/** A spelled-out or written number as a value; NaN where it is neither. */
export function count(word: string): number {
  const lower = word.toLowerCase()
  if (/^\d+$/.test(lower)) return Number(lower)
  const cardinal = CARDINALS.indexOf(lower)
  return cardinal === -1 ? ORDINALS.indexOf(lower) : cardinal
}

/** How many consumer names a stretch of prose names, the longest first, so a name inside a longer one is not counted twice. */
export function namesIn(text: string, names: readonly string[] = NAMES): number {
  let rest = text.replace(/\s+/g, " ")
  let found = 0
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    while (rest.includes(name)) {
      rest = rest.replace(name, " ")
      found += 1
    }
  }
  return found
}

const NUMBER = `(${[...CARDINALS].reverse().join("|")}|\\d+)`

/** Each "<n> are <kind> (<names>)" clause in a paragraph, with the names it lists. */
export function clauses(text: string): { said: number; listed: number; clause: string }[] {
  const found = []
  // The kind may hold a full stop (`./site`), so the bound is a length rather than a sentence.
  for (const match of text.matchAll(new RegExp(`\\b${NUMBER} (?:is|are) [^(;]{0,80}?\\(([^)]*)\\)`, "gi"))) {
    found.push({ said: count(match[1]), listed: namesIn(match[2]), clause: match[0].replace(/\s+/g, " ") })
  }
  return found
}

const readme = readFileSync(join(root, "README.md"), "utf8")
/** The opening, before the first section: where the register is introduced. */
const opening = readme.slice(0, readme.indexOf("\n## "))

describe("VDS245: the README counts the consumers consumers.json declares", () => {
  it("says how many applications install the package", () => {
    const said = [...opening.matchAll(new RegExp(`\\bthe ${NUMBER} applications`, "gi"))].map((m) => count(m[1]))
    expect(said.length, "the opening no longer states the count, so this measures nothing").toBeGreaterThan(0)
    for (const n of said) expect(n).toBe(consumers.length)
  })

  it("names the next consumer by the next ordinal", () => {
    const next = new RegExp(`\\bA (${[...ORDINALS].reverse().join("|")}) is one entry`, "i").exec(opening)
    expect(next, "the opening no longer names the next consumer").not.toBeNull()
    expect(count(next![1])).toBe(consumers.length + 1)
  })

  it("lists as many consumers in each clause as the clause says, and all of them across the clauses", () => {
    const found = clauses(opening)
    expect(found.length, "no '<n> are …' clause was read").toBeGreaterThan(3)
    for (const c of found) expect(c.listed, c.clause).toBe(c.said)
    expect(found.reduce((sum, c) => sum + c.said, 0)).toBe(consumers.length)
  })

  it("reads numbers and nested names the way the prose writes them", () => {
    expect(count("eighteen")).toBe(18)
    expect(count("Nineteenth")).toBe(19)
    expect(namesIn("the Alpha App, the Alpha App Site", ["Alpha App", "Alpha App Site"])).toBe(2)
    expect(clauses("two are Vite marketing sites (the Alpha and the Beta)")[0]).toMatchObject({ said: 2 })
    expect(clauses("four are Vite product sites on `./site`\n(the Alpha)")[0]).toMatchObject({ said: 4 })
  })
})
