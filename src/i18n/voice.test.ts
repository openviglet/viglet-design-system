import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * VDS244 — the strings this package ships follow docs/BRAND.md, in both
 * locales: sentence case, the single-character ellipsis, no exclamation mark and
 * no "please". The console-era strings broke all four, and a product reading
 * the shared keys showed two voices on one screen; this keeps them from drifting
 * back, and holds every string added later to the same rules.
 */

const localesDir = resolve(import.meta.dirname, "locales")

type Leaf = { file: string; key: string; value: string }

function leaves(value: unknown, file: string, prefix = ""): Leaf[] {
  if (typeof value === "string") return [{ file, key: prefix, value }]
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, file, prefix ? `${prefix}.${k}` : k))
  }
  return []
}

const strings: Leaf[] = readdirSync(localesDir).flatMap((lang) =>
  readdirSync(join(localesDir, lang)).flatMap((file) =>
    leaves(JSON.parse(readFileSync(join(localesDir, lang, file), "utf8")), `${lang}/${file}`),
  ),
)

/** Names that keep their capital wherever they fall in a label. */
const PROPER = new Set(["Viglet", "Enter", "Esc", "Escape", "Space"])

/**
 * A label in Title Case: two words or more, and every word after the first
 * capitalised, where none of them is an acronym (`URL`) or a proper name.
 * `Endpoint URL` and `Talk to Viglet` pass; `Save Changes` does not.
 */
export function titleCase(value: string): boolean {
  // Each sentence on its own: the word after a full stop starts one.
  return value.split(/[.?!:]\s+/).some((sentence) => {
    const words = sentence
      .replace(/\{\{[^}]*\}\}/g, " ")
      .split(/\s+/)
      .filter((w) => /^[\p{L}]+$/u.test(w))
    if (words.length < 2) return false
    const rest = words.slice(1)
    const capitalised = rest.every((w) => /^\p{Lu}/u.test(w))
    const named = rest.every((w) => w === w.toUpperCase() || PROPER.has(w))
    return capitalised && !named
  })
}

describe("VDS244: the shipped strings follow the brand guide", () => {
  it("reads every string of both locales, so the rules below have subjects", () => {
    expect(strings.length).toBeGreaterThan(300)
    expect(new Set(strings.map((s) => s.file.split("/")[0]))).toEqual(new Set(["en", "pt"]))
  })

  it("writes labels in sentence case", () => {
    expect(strings.filter((s) => titleCase(s.value)).map((s) => `${s.file} ${s.key}: ${s.value}`)).toEqual([])
  })

  it("writes an ellipsis as one character", () => {
    expect(strings.filter((s) => s.value.includes("...")).map((s) => `${s.file} ${s.key}: ${s.value}`)).toEqual([])
  })

  it("uses no exclamation mark and no please", () => {
    const loud = strings.filter((s) => s.value.includes("!") || /\b(please|por favor)\b/i.test(s.value))
    expect(loud.map((s) => `${s.file} ${s.key}: ${s.value}`)).toEqual([])
  })

  it("tells Title Case from a name or an acronym", () => {
    expect(titleCase("Save Changes")).toBe(true)
    expect(titleCase("Informações Gerais")).toBe(true)
    expect(titleCase("Save changes")).toBe(false)
    expect(titleCase("Endpoint URL")).toBe(false)
    expect(titleCase("Talk to Viglet")).toBe(false)
    expect(titleCase("Step {{index}} of {{count}}")).toBe(false)
    expect(titleCase("Server unavailable. Retrying automatically…")).toBe(false)
  })
})
