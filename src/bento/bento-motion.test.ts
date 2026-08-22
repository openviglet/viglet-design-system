import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const stylesheet = readFileSync(join(resolve(import.meta.dirname), "bento.css"), "utf8")

// src/styles/reduced-motion.test.ts asks a weaker question of every stylesheet:
// does it mention prefers-reduced-motion at all. This asks the one this task's
// criterion actually names — is *every* animation it starts turned off — because
// a guard covering six of seven classes passes the weaker test and still moves
// for a reader who asked it not to.

/** The body of every `@media (prefers-reduced-motion: reduce)` block. */
function reducedMotionBlocks(css: string): string {
  const blocks: string[] = []
  const opener = /@media[^{]*prefers-reduced-motion\s*:\s*reduce[^{]*\{/g
  for (let match = opener.exec(css); match; match = opener.exec(css)) {
    // Walk braces from the opener to find the matching close.
    let depth = 1
    let i = match.index + match[0].length
    const start = i
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++
      else if (css[i] === "}") depth--
      i++
    }
    blocks.push(css.slice(start, i - 1))
  }
  return blocks.join("\n")
}

/** Selectors that start an animation or a transition, outside any guard. */
function animatingSelectors(css: string): string[] {
  const guarded = reducedMotionBlocks(css)
  const unguarded = guarded ? css.split(guarded).join("") : css

  const found = new Set<string>()
  // A rule is `selector { ... }`; keyframe steps are excluded by requiring the
  // selector to contain a class or a pseudo-element rather than a percentage.
  const rule = /([^{}]+)\{([^{}]*)\}/g
  for (let match = rule.exec(unguarded); match; match = rule.exec(unguarded)) {
    const [, selector, body] = match
    if (!/(^|[\s;])(animation|transition)\s*:/.test(body)) continue
    if (/^\s*(from|to|\d+%)/.test(selector)) continue
    for (const part of selector.split(",")) {
      const cleaned = part.trim()
      if (cleaned.startsWith("@") || cleaned === "") continue
      found.add(cleaned)
    }
  }
  return [...found]
}

/** The class the guard has to name for this selector to be covered. */
function baseClass(selector: string): string | null {
  // `.bento-grid > .bento-tile:nth-child(2)` is covered by `.bento-tile`.
  const classes = [...selector.matchAll(/\.([a-z0-9-]+)/g)].map((m) => m[1])
  return classes.length > 0 ? classes[classes.length - 1] : null
}

describe("bento.css answers prefers-reduced-motion for everything it animates", () => {
  const guard = reducedMotionBlocks(stylesheet)
  const selectors = animatingSelectors(stylesheet)

  it("has a reduced-motion block at all", () => {
    expect(guard.length).toBeGreaterThan(0)
  })

  it("animates something, so the check has subjects", () => {
    expect(selectors.length).toBeGreaterThan(4)
  })

  it.each(selectors)("%s is turned off under reduced motion", (selector) => {
    const cls = baseClass(selector)
    expect(cls, `${selector} has no class for the guard to name`).not.toBeNull()
    expect(
      guard,
      `.${cls} animates but the reduced-motion block never names it. ` +
        "Add it there — a page that keeps moving for a reader who asked it not to " +
        "is the failure this file's guard exists to prevent.",
    ).toContain(`.${cls}`)
  })

  it("keeps the scroll morph legible rather than merely still", () => {
    // The hero-to-save-bar handoff is driven by --bento-fade, not by an
    // animation, so the guard must neutralise the travel and leave the opacity
    // swap working — otherwise the sticky bar never appears at all.
    expect(guard).toMatch(/\.bento-fade-(out|in)/)
    expect(guard).toContain("transform: none")
    expect(guard).not.toMatch(/\.bento-fade-in\s*\{[^}]*opacity:\s*0/)
  })

  it("cuts the view-transition morph to an instant swap", () => {
    expect(guard).toContain("::view-transition-old(bento-hero)")
  })
})
