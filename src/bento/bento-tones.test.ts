import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  BENTO_TONES,
  BENTO_TONE_CLASS,
  bentoChipClass,
  type BentoTone,
} from "./bento-tones"

const bentoDir = resolve(import.meta.dirname)
const presetPath = resolve(bentoDir, "..", "styles", "preset.css")
const stylesheetPath = join(bentoDir, "bento.css")

describe("bento tones", () => {
  it("names a class per tone and nothing else", () => {
    expect(BENTO_TONES).toEqual([
      "blue",
      "indigo",
      "violet",
      "emerald",
      "amber",
      "rose",
      "slate",
    ])
  })

  it("falls back to slate for a tone that is not one, rather than rendering unstyled", () => {
    expect(bentoChipClass(undefined)).toBe("bento-chip bento-tone-slate")
    expect(bentoChipClass("nonsense" as BentoTone)).toBe("bento-chip bento-tone-slate")
  })

  it("always pairs the tone class with the chip class that paints it", () => {
    for (const tone of BENTO_TONES) {
      expect(bentoChipClass(tone)).toBe(`bento-chip ${BENTO_TONE_CLASS[tone]}`)
    }
  })
})

describe("the tone tokens", () => {
  const preset = readFileSync(presetPath, "utf8")
  const stylesheet = readFileSync(stylesheetPath, "utf8")

  it.each(BENTO_TONES)("%s resolves to two OKLCH stops in the preset", (tone) => {
    for (const stop of ["from", "to"]) {
      const declaration = new RegExp(
        `--vg-bento-tone-${tone}-${stop}:\\s*oklch\\([^)]+\\)`,
      )
      expect(preset).toMatch(declaration)
    }
  })

  it.each(BENTO_TONES)("%s has a rule that wires the token to the chip", (tone) => {
    expect(stylesheet).toContain(`.bento-tone-${tone}`)
    expect(stylesheet).toContain(`var(--vg-bento-tone-${tone}-from)`)
    expect(stylesheet).toContain(`var(--vg-bento-tone-${tone}-to)`)
  })

  it("paints the chip from the properties rather than from a named colour", () => {
    expect(stylesheet).toMatch(/\.bento-chip\s*\{[^}]*var\(--bento-tone-from/)
  })
})

// The last clause of this task's criterion, held as a rule rather than as a
// habit: no source in the bento layer may name a Tailwind colour class. That is
// what made the palette this package's instead of the product's, and it is the
// thing that would quietly come back as components arrive in later lines.
describe("no shared bento source names a Tailwind colour", () => {
  const PALETTE =
    "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
  const COLOUR_CLASS = new RegExp(
    `\\b(?:from|via|to|bg|text|border|ring|shadow|fill|stroke|outline|decoration|accent|caret|divide)-(?:${PALETTE})-\\d{2,3}\\b`,
  )

  function sources(dir: string, found: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) sources(full, found)
      else if (/\.(ts|tsx|css)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
        found.push(full)
      }
    }
    return found
  }

  const files = sources(bentoDir)

  it("has sources to check", () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map((f) => relative(bentoDir, f).replace(/\\/g, "/")))(
    "%s",
    (name) => {
      const source = readFileSync(join(bentoDir, name), "utf8")
      const match = COLOUR_CLASS.exec(source)
      expect(
        match?.[0],
        `${name} names the Tailwind colour class "${match?.[0]}". A tone is a token: ` +
          "add it to the preset as --vg-bento-tone-*, and read it through .bento-chip.",
      ).toBeUndefined()
    },
  )
})
