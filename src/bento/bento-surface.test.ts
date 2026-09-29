import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import postcss from "postcss"
import { describe, expect, it } from "vitest"

// VDS182 — a quieter surface. Every panel frosting what sat behind it was one of
// the reasons a working screen read as a collage, so the panel is a solid card
// and frost is kept for the one surface content scrolls under, the save bar.
// Asserted over the source because jsdom computes no backdrop-filter.

const css = postcss.parse(readFileSync(resolve(import.meta.dirname, "bento.css"), "utf8"))

function declarations(selector: string): Record<string, string> {
  const found: Record<string, string> = {}
  css.walkRules((rule) => {
    if (rule.selector !== selector) return
    rule.walkDecls((decl) => {
      found[decl.prop] = decl.value
    })
  })
  return found
}

describe("the bento surfaces", () => {
  it("draws the panel as a solid card on its border", () => {
    const glass = declarations(".bento-glass")
    expect(glass.background).toBe("var(--card)")
    expect(glass.border).toBe("1px solid var(--border)")
    expect(glass["backdrop-filter"]).toBeUndefined()
  })

  it("keeps frost for a surface content scrolls under", () => {
    expect(declarations(".bento-frost")["backdrop-filter"]).toMatch(/blur/)
  })
})
