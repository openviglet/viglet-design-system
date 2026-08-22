import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const srcDir = resolve(import.meta.dirname, "..")
const presetPath = join(srcDir, "styles", "preset.css")
const stylesheetPath = join(srcDir, "styles", "index.css")

/**
 * Files where a brand hue is *a variant among several*, not *the* accent.
 *
 * The distinction is the same one `bento-tones.test.ts` draws, and it is
 * narrower than it first looks. A component keyed by **colour name** —
 * `variant="blue" | "orange" | "green"` — is a palette: the caller picked that
 * hue deliberately and re-keying the product accent must not repaint one arm of
 * it. A component keyed by **role** — default, outline, ghost — is not, even
 * though it also has several variants: there, blue is the primary action, which
 * is the product's colour by another name. `GradientButton` and
 * `GradientSwitch` read as palettes and are not, which is why the second
 * assertion below tests the variant *names* rather than trusting this list.
 */
const VARIANT_PALETTES: Record<string, string> = {
  "components/ui/section-card.tsx": "blue | violet | emerald | amber | rose | cyan",
  "components/ui/sticky-save-bar.tsx": "gray | blue | orange | green",
}

/** Hues a palette must offer besides blue, or it is not a palette. */
const OTHER_HUES = /\b(?:emerald|amber|rose|orange|green|gray|slate|violet|purple|red|cyan|teal|pink|sky)-[0-9]{2,3}\b/g

/** Every shipped source — not the tests, not the stories. */
function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sources(full, found)
    else if (/\.(tsx?|css)$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) {
      found.push(full)
    }
  }
  return found
}

/**
 * Built per call: a `/g` regex carries `lastIndex` between uses, which is how a
 * guard like this one silently passes having matched nothing.
 */
const bluePattern = () => /\b(?:from|to|via|text|bg|border|ring|shadow|fill|stroke|outline|decoration|divide|accent|caret)-(?:blue|indigo)-[0-9]{2,3}\b/g

describe("the brand accent is a token", () => {
  it("declares the accent, its derivations and a dark twin for the foreground", () => {
    const preset = readFileSync(presetPath, "utf8")
    for (const token of [
      "--vg-accent-from",
      "--vg-accent-to",
      "--vg-accent-text",
      "--vg-accent-text-dark",
      "--vg-accent-fg",
      "--vg-accent-surface",
      "--vg-accent-surface-strong",
      "--vg-accent-line",
    ]) {
      expect(preset, `${token} is missing from the preset`).toContain(`${token}:`)
    }

    // Everything derives from the two stops: a product re-points -from/-to and
    // the tint, the line and the surfaces follow. Only the readable foreground
    // is stated separately, because contrast is not a mix away.
    for (const derived of ["--vg-accent-surface", "--vg-accent-surface-strong", "--vg-accent-line"]) {
      const line = preset.split(/\r?\n/).find((l) => l.trim().startsWith(`${derived}:`))
      expect(line, `${derived} should derive from --vg-accent-from`).toContain("--vg-accent-from")
    }

    // The dark block re-points the foreground, which is what lets a component
    // write text-[var(--vg-accent-fg)] with no dark: twin.
    const darkBlock = preset.slice(preset.indexOf(".dark,"))
    expect(darkBlock).toContain("--vg-accent-fg: var(--vg-accent-text-dark)")
  })

  it("ships utilities that read the tokens and never a literal hue", () => {
    const css = readFileSync(stylesheetPath, "utf8")
    for (const utility of [".vg-accent-chip", ".vg-accent-text", ".vg-accent-solid"]) {
      expect(css, `${utility} is missing`).toContain(utility)
    }
    const accentRules = css.slice(css.indexOf(".vg-accent-chip"))
    expect(accentRules.match(bluePattern())).toBeNull()
  })

  it("hardcodes no product hue in a shared component outside a variant palette", () => {
    const offenders: string[] = []
    let scanned = 0

    for (const file of sources(join(srcDir, "components"))) {
      const rel = relative(srcDir, file).replaceAll("\\", "/")
      if (VARIANT_PALETTES[rel]) continue
      scanned++
      const hits = readFileSync(file, "utf8").match(bluePattern())
      if (hits) offenders.push(`${rel}: ${[...new Set(hits)].join(" ")}`)
    }

    // Non-vacuous: the sweep has to have read the components that were swept.
    expect(scanned).toBeGreaterThan(50)
    expect(offenders).toEqual([])
  })

  /**
   * A component reads the derived tokens through Tailwind's arbitrary-value
   * syntax rather than through a custom class, because a custom class cannot
   * carry a variant: `hover:vg-accent-text` names nothing and styles nothing.
   *
   * The failure is silent — the class string looks right in the source and the
   * hover state simply never arrives — so the proof has to be that Tailwind
   * emitted the rule. Skipped without a build; CI runs `build` before `test`.
   */
  it("emits every arbitrary-value utility the components ask for", () => {
    const built = resolve(srcDir, "..", "dist", "viglet-design-system.css")
    if (!existsSync(built)) return
    const css = readFileSync(built, "utf8")

    const used = new Set<string>()
    for (const file of sources(join(srcDir, "components"))) {
      for (const hit of readFileSync(file, "utf8").matchAll(
        /[\w-]+(?::[\w-]+)*-\[var\(--vg-accent-[a-z-]+\)\]/g,
      )) {
        used.add(hit[0])
      }
    }

    // Non-vacuous: the accent is used through this syntax in several places.
    expect(used.size).toBeGreaterThan(5)

    const selector = (cls: string) => "." + cls.replace(/[:[\]().]/g, (m) => "\\" + m)
    const missing = [...used].filter((cls) => !css.includes(selector(cls)))
    expect(missing, "Tailwind generated no rule for these — the class is inert").toEqual([])
  })

  it("keeps every exempt file a palette — keyed by colour, not by role", () => {
    for (const [rel, hues] of Object.entries(VARIANT_PALETTES)) {
      const text = readFileSync(join(srcDir, rel), "utf8")
      expect(
        text.match(bluePattern()),
        `${rel} no longer uses blue — drop it from VARIANT_PALETTES`,
      ).not.toBeNull()

      // A palette names other hues too. One that only knows blue is the accent
      // wearing a variant's clothes.
      expect(text.match(OTHER_HUES), `${rel} only uses blue, so it is not a palette`).not.toBeNull()

      // And its keys are colours. `default | outline | ghost` is a set of roles
      // whose primary arm is the accent — that is the exemption this catches.
      for (const hue of hues.split(" | ")) {
        expect(text, `${rel} no longer offers a "${hue}" variant`).toMatch(
          new RegExp(`\\b${hue}\\s*:`),
        )
      }
    }
  })
})
