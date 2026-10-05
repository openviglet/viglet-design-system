import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// VDS199 — one monospace family, held over the source.
//
// preset.css declares --vg-font-mono and maps Tailwind's --font-mono to it, so
// `font-mono` and the code/pre default resolve to one stack. A second mono can
// only come back by name: a stylesheet's font-family, or an arbitrary
// `font-[…]` class. Those are what this reads for. The stack itself is the one
// place a family may be named.

const srcRoot = resolve(import.meta.dirname, "..")

function sources(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) sources(full, found)
    else if (/\.(tsx?|css)$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name)) found.push(full)
  }
  return found
}

const MONO = /mono|courier|consolas|menlo|fira code|source code/i

const files = sources(srcRoot).map((file) => ({
  name: relative(srcRoot, file).replace(/\\/g, "/"),
  source: readFileSync(file, "utf8"),
}))

describe("the package names one monospace family", () => {
  it("declares the stack and maps font-mono to it", () => {
    const preset = files.find(({ name }) => name === "styles/preset.css")!.source
    expect(preset).toMatch(/--vg-font-mono:\s*"JetBrains Mono", ui-monospace/)
    expect(preset).toMatch(/--font-mono:\s*var\(--vg-font-mono\)/)
  })

  it("names no other mono in a stylesheet", () => {
    const offenders = files
      .filter(({ name }) => name.endsWith(".css"))
      .flatMap(({ name, source }) =>
        [...source.matchAll(/font-family:\s*([^;]+);/g)]
          .filter(([, value]) => MONO.test(value) && !value.trim().startsWith("var(--vg-font-mono"))
          .map(([declaration]) => `${name}: ${declaration}`),
      )
    expect(offenders).toEqual([])
  })

  it("writes no arbitrary font family in a class", () => {
    const offenders = files.flatMap(({ name, source }) =>
      [...source.matchAll(/\bfont-\[[^\]]+\]/g)].map(([match]) => `${name}: ${match}`),
    )
    expect(offenders).toEqual([])
  })
})
