import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { vigDesignSystemTranslations } from "./index"

const srcDir = resolve(import.meta.dirname, "..")
const localesDir = join(srcDir, "i18n", "locales")

/**
 * VDS51 — a string this package asks for is a string it ships.
 *
 * `bento-i18n.test.tsx` asks exactly this and is scoped to `bento.*`, those
 * being the strings that layer owns. Nothing took the other half, and twenty
 * keys in `forms.*`, `common.*` and `nav.*` were called by this package's own
 * components and shipped in neither locale.
 *
 * Mostly that rendered the English `defaultValue` inside a Portuguese product.
 * Four were worse: called with no default at all, so i18next returned the key —
 * and two of those were `aria-label`, which had a screen reader announcing
 * `forms.iconPicker.chooseAnIcon`.
 *
 * The namespaces are the directory listing rather than a list here: a key
 * outside them is the consumer's to provide, which is why `llm.title` and
 * `home.title` are asked for and correctly absent.
 */

/**
 * The namespaces this package ships — the top-level keys inside the bundles,
 * not the file names. `common.json` holds `common`, `backendStatus` and
 * `errorBoundary`, so reading the listing instead called `backendStatus.retry`
 * a consumer's, which this suite's last assertion caught.
 */
const OWNED = new Set(
  readdirSync(join(localesDir, "en")).flatMap((file) =>
    Object.keys(JSON.parse(readFileSync(join(localesDir, "en", file), "utf8"))),
  ),
)

function leaves(value: unknown, prefix = "", out = new Set<string>()): Set<string> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      leaves(child, prefix ? `${prefix}.${key}` : key, out)
    }
  } else if (prefix) {
    out.add(prefix)
  }
  return out
}

/** Shipped source — a story or a test asking for a key proves nothing. */
function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sources(full, found)
    else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) found.push(full)
  }
  return found
}

/**
 * Built per call: a `/g` regex carries `lastIndex` between uses, which is how a
 * sweep like this one silently passes having matched nothing.
 */
const translationCall = () => /\bt\(\s*["'`]([a-zA-Z][\w.]*)["'`]/g

const asked = new Set<string>()
for (const file of sources(join(srcDir))) {
  for (const [, key] of readFileSync(file, "utf8").matchAll(translationCall())) asked.add(key)
}

const ours = [...asked].filter((key) => OWNED.has(key.split(".")[0]))
const locales = Object.keys(vigDesignSystemTranslations) as (keyof typeof vigDesignSystemTranslations)[]

describe("the locale bundles answer what the package asks", () => {
  it("finds calls to check, and namespaces to check them against", () => {
    // Non-vacuous: without these the loops below assert nothing.
    expect(ours.length).toBeGreaterThan(50)
    expect(OWNED.size).toBeGreaterThanOrEqual(6)
    expect(locales.length).toBeGreaterThanOrEqual(2)
  })

  it.each(locales)("%s ships every string this package asks for", (locale) => {
    const shipped = leaves(vigDesignSystemTranslations[locale])
    const missing = ours.filter((key) => !shipped.has(key))
    expect(missing, `${locale} is missing strings this package's own components ask for`).toEqual([])
  })

  it("holds every locale to the same keys", () => {
    // A key added to one bundle only renders the other language, or the raw
    // key where no defaultValue was passed.
    const [first, ...rest] = locales.map((l) => [l, leaves(vigDesignSystemTranslations[l])] as const)
    for (const [locale, keys] of rest) {
      const onlyInFirst = [...first[1]].filter((k) => !keys.has(k))
      const onlyInOther = [...keys].filter((k) => !first[1].has(k))
      expect(onlyInFirst, `in ${first[0]} but not ${locale}`).toEqual([])
      expect(onlyInOther, `in ${locale} but not ${first[0]}`).toEqual([])
    }
  })

  it("leaves a consumer's namespace to the consumer", () => {
    // `llm.title` and `home.title` are asked for by a component that expects
    // the product to supply the word. Shipping them here would be this package
    // guessing at a product's vocabulary.
    const theirs = [...asked].filter((key) => !OWNED.has(key.split(".")[0]))
    expect(theirs.length, "no key is outside the shipped namespaces — has one been added?").toBeGreaterThan(0)
    const shipped = leaves(vigDesignSystemTranslations.en)
    for (const key of theirs) {
      expect(shipped.has(key), `${key} is a consumer's to provide`).toBe(false)
    }
  })
})
