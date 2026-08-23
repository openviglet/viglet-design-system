import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { vigDesignSystemTranslations } from "@/i18n"

// The chrome has to render words in a console that has never heard of it. A
// missing key is not a crash — it renders the key, so a rail reading
// "bento.nav.label" ships and nobody notices until a screenshot. These checks
// are over the bundles rather than over a render, so they cover every string
// the layer can reach rather than the ones a story happens to show.

const bentoDir = resolve(import.meta.dirname)

function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sources(full, found)
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) {
      found.push(full)
    }
  }
  return found
}

/** Every `t("bento.…")` key the layer asks for. */
const used = [
  ...new Set(
    sources(bentoDir)
      .flatMap((file) => [
        ...readFileSync(file, "utf8").matchAll(/\bt\(\s*["'`](bento\.[\w.]+)["'`]/g),
      ])
      .map((m) => m[1]),
  ),
].sort()

function lookup(bundle: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>(
    (node, part) =>
      node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
    bundle,
  )
}

describe("the bento chrome ships its own strings", () => {
  it("asks for some, so the check has subjects", () => {
    expect(used.length).toBeGreaterThan(10)
  })

  it.each(used)("en: %s", (key) => {
    const value = lookup(vigDesignSystemTranslations.en, key)
    expect(typeof value, `${key} is missing from the English bundle`).toBe("string")
    expect(value).not.toBe("")
  })

  it.each(used)("pt: %s", (key) => {
    const value = lookup(vigDesignSystemTranslations.pt, key)
    expect(typeof value, `${key} is missing from the Portuguese bundle`).toBe("string")
    expect(value).not.toBe("")
  })

  it("translates rather than copying — the two locales differ", () => {
    const identical = used.filter(
      (key) =>
        lookup(vigDesignSystemTranslations.en, key) ===
        lookup(vigDesignSystemTranslations.pt, key),
    )
    // "Global" is the same word in both, and a few may legitimately match.
    expect(identical.length).toBeLessThan(used.length / 4)
  })
})

// Every `bento.*` call also carries an object-form default, so a consumer that
// never registers these translations still renders words rather than keys. The
// string form is the ambiguous i18next signature and most test mocks ignore it.
//
// Scoped to `bento.*`: those are the strings this layer owns. A call to a key
// from another namespace is asking the consumer for a word it already has.
describe("every bento string has an object-form default", () => {
  const files = sources(bentoDir)

  it.each(files.map((f) => f.replace(bentoDir, "").replace(/\\/g, "/")))("%s", (name) => {
    const source = readFileSync(join(bentoDir, name), "utf8")
    const withoutDefault: string[] = []

    for (const match of source.matchAll(/\bt\(\s*["'`](bento\.[\w.]+)["'`]\s*([,)])/g)) {
      const [, key, next] = match
      if (next === ")") {
        withoutDefault.push(key)
        continue
      }
      const after = source.slice(match.index + match[0].length, match.index + match[0].length + 200)
      if (!after.includes("defaultValue")) withoutDefault.push(key)
    }

    expect(
      withoutDefault,
      `${name} calls t() without an object-form default for: ${withoutDefault.join(", ")}. ` +
        'Pass t("key", { defaultValue: "…" }) so a consumer that never registered ' +
        "these translations still renders words rather than keys.",
    ).toEqual([])
  })
})

describe("the locale bundles hold no product's strings", () => {
  const bundles = ["en", "pt"] as const

  it.each(bundles)("%s", (lang) => {
    const bento = (vigDesignSystemTranslations[lang] as Record<string, unknown>).bento
    const text = JSON.stringify(bento)

    // VDS73 — every consumer's name, not the three the strings were extracted
// from. A shared string naming any product is the defect; widening the list
// only strengthens it.
for (const product of ["Turing", "Shio", "Dumont", "Cloud Console", "Cloud Home", "Schools"]) {
      expect(text, `the ${lang} bento strings name ${product}`).not.toContain(product)
    }
  })
})
