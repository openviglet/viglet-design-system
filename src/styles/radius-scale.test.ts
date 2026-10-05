import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// VDS198 — the closed radius scale, held over the source.
//
// preset.css points every Tailwind radius key at --vg-radius-control or
// --vg-radius-panel, so a `rounded-*` class lands on the scale wherever it is
// written (radius-scale.parity.test.tsx measures that in a browser). What can
// still leave it is a radius the theme never sees: Tailwind's bare `rounded`,
// which is a fixed 4 px, an arbitrary `rounded-[…]`, and a literal
// `border-radius` in a stylesheet. Those are what this reads for.

const srcRoot = resolve(import.meta.dirname, "..")

function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sources(full, found)
    else if (/\.(tsx?|css)$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name)) found.push(full)
  }
  return found
}

/** Radii that are a shape rather than a step on the scale, each with its reason. */
const EXEMPT: Record<string, string> = {
  // The arrow is a 10 px square turned 45 degrees: a control radius would round it into a blob.
  "components/ui/tooltip.tsx": "rounded-[2px]",
  // A product logo's mask, a percentage of the mark and not a surface's corner.
  "components/app-switcher.tsx": "rounded-[18%] rounded-[14%]",
}

/** What a stylesheet may set a radius to: a token, a circle, or its parent's. */
const ON_SCALE = /^(var\(--[\w-]+(,\s*[\d.]+rem)?\)|50%|9999px|inherit)$/

const files = sources(srcRoot).map((file) => ({
  name: relative(srcRoot, file).replace(/\\/g, "/"),
  source: readFileSync(file, "utf8"),
}))

describe("every radius in the package is on the closed scale", () => {
  it("finds the sources to read", () => {
    expect(files.length).toBeGreaterThan(100)
  })

  it("writes no bare `rounded`, which is a fixed 4 px", () => {
    // Read inside string literals only, so a comment's "a rounded edge" is prose.
    const offenders = files
      .filter(({ name }) => !name.endsWith(".css"))
      .filter(({ source }) =>
        [...source.matchAll(/(["'`])([^"'`\n]*)\1/g)].some(([, , text]) => text.split(/\s+/).includes("rounded")),
      )
      .map(({ name }) => name)
    expect(offenders).toEqual([])
  })

  it("writes no arbitrary radius outside the named exemptions", () => {
    const offenders = files.flatMap(({ name, source }) =>
      [...source.matchAll(/\brounded(?:-[a-z]{1,2})?-\[[^\]]+\]/g)]
        .map(([match]) => match)
        .filter((match) => !(EXEMPT[name] ?? "").split(" ").includes(match))
        .map((match) => `${name}: ${match}`),
    )
    expect(offenders).toEqual([])
  })

  it("sets no literal border-radius in a stylesheet", () => {
    const offenders = files
      .filter(({ name }) => name.endsWith(".css"))
      .flatMap(({ name, source }) =>
        [...source.matchAll(/border-radius:\s*([^;]+);/g)]
          .filter(([, value]) => !ON_SCALE.test(value.trim()))
          .map(([declaration]) => `${name}: ${declaration}`),
      )
    expect(offenders).toEqual([])
  })
})
