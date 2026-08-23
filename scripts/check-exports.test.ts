import { describe, expect, it } from "vitest"

import { importEverything, requireEverything, typeProbe } from "./check-exports.mjs"

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

describe("the module that requires every CJS entry", () => {
  const exportsMap = {
    ".": { import: "./dist/index.es.js", require: "./dist/index.cjs" },
    "./bento": { import: "./dist/bento.es.js", require: "./dist/bento.cjs" },
    "./bento.css": "./dist/bento.css",
    "./styles": "./dist/viglet-design-system.css",
  }

  it("requires each entry that offers the condition, and no stylesheet", () => {
    const source = requireEverything(exportsMap)
    expect(source).toContain('["' + '.","./bento"]')
    expect(source).not.toContain("bento.css")
  })

  it("fails on an entry that requires to nothing", () => {
    // VDS50 was the loud version — Node refusing the file outright — but an
    // entry that loads to an empty object is the same promise broken quietly.
    expect(requireEverything(exportsMap)).toContain("required to an empty object")
  })

  it("exits non-zero rather than only printing", () => {
    expect(requireEverything(exportsMap)).toContain("process.exitCode = 1")
  })

  it("says nothing where no entry offers require", () => {
    const source = requireEverything({ "./styles": "./dist/viglet-design-system.css" })
    expect(source).toContain("const subpaths = []")
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

  // VDS69 — the case that read dist/exports.json to assert the probe covers
  // every catalogued entry lived here, and made this suite need a build: both
  // workflows run Test before Build, so a clean checkout threw ENOENT while a
  // stale local dist kept it green. check-exports.mjs makes that assertion
  // where the artefact exists — it refuses a missing catalogue outright, then
  // type-checks the probe against the real declarations, which is stronger
  // than matching the generated source. Nothing below needs anything built.
})
