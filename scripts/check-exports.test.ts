import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { importEverything, typeProbe } from "./check-exports.mjs"

const root = resolve(import.meta.dirname, "..")

// VDS49 — the bundling and the tsc run happen at the end of `pnpm run build`,
// in about a second. What is asserted here is the two generated probes, because
// a probe that asserts nothing is the failure this repository keeps meeting: a
// namespace nothing reads is tree-shaken away, and a type import nothing uses
// resolves to `any` without complaint.

describe("the module that imports every subpath", () => {
  const exportsMap = {
    ".": { import: "./dist/index.es.js" },
    "./bento": { import: "./dist/bento.es.js" },
    "./bento.css": "./dist/bento.css",
    "./exports.json": "./dist/exports.json",
  }

  it("imports each subpath by the specifier a consumer writes", () => {
    const source = importEverything(exportsMap)
    expect(source).toContain('"@viglet/viglet-design-system"')
    expect(source).toContain('"@viglet/viglet-design-system/bento"')
    expect(source).toContain('"@viglet/viglet-design-system/bento.css"')
  })

  it("reads each namespace, so the bundler cannot drop it", () => {
    // check-size recorded a 0-byte chunk once for exactly this reason: an
    // unread namespace is tree-shaken, and a bundle that resolved nothing also
    // proves nothing.
    const source = importEverything(exportsMap)
    expect(source).toMatch(/globalThis\.__vdsProbe = \[m0, m1, m2\]/)
  })

  it("imports a stylesheet for its side effect, with no namespace to read", () => {
    const source = importEverything({ "./bento.css": "./dist/bento.css" })
    expect(source).toContain('import "@viglet/viglet-design-system/bento.css";')
    expect(source).toMatch(/globalThis\.__vdsProbe = \[\]/)
  })

  it("gives JSON an import attribute, which is how a bundler will take it", () => {
    const source = importEverything({ "./exports.json": "./dist/exports.json" })
    expect(source).toContain('with { type: "json" }')
  })
})

describe("the module that type-checks every typed subpath", () => {
  const catalogue = {
    entries: {
      ".": { specifier: "@viglet/viglet-design-system", values: ["GradientButton", "Badge"] },
      "./bento": { specifier: "@viglet/viglet-design-system/bento", values: ["BentoHero"] },
    },
  }

  it("imports one real exported value per entry", () => {
    const source = typeProbe(catalogue)
    expect(source).toContain('import { GradientButton } from "@viglet/viglet-design-system";')
    expect(source).toContain('import { BentoHero } from "@viglet/viglet-design-system/bento";')
  })

  it("uses what it imports, so a wrong types field is an error and not an any", () => {
    expect(typeProbe(catalogue)).toContain("export const used: unknown[] = [GradientButton, BentoHero]")
  })

  it("refuses a catalogue with no value to import rather than passing", () => {
    expect(() => typeProbe({ entries: { ".": { specifier: "x", values: [] } } })).toThrow(
      /assert nothing/,
    )
    expect(() => typeProbe({ entries: {} })).toThrow(/assert nothing/)
  })

  it("covers every typed entry the build catalogued", () => {
    // Derived from dist/exports.json rather than listed, so a subpath added
    // tomorrow is covered without anyone editing this file — the lesson of
    // VDS43, VDS45 and VDS47.
    const path = join(root, "dist", "exports.json")
    const built = JSON.parse(readFileSync(path, "utf8")) as {
      entries: Record<string, { specifier: string; values?: string[] }>
    }
    const source = typeProbe(built)

    const entries = Object.values(built.entries).filter((e) => (e.values ?? []).length > 0)
    expect(entries.length).toBeGreaterThan(4)
    for (const entry of entries) {
      expect(source, `${entry.specifier} is not in the probe`).toContain(
        `from ${JSON.stringify(entry.specifier)}`,
      )
    }
  })
})
