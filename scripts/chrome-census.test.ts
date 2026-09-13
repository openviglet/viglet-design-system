import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { census, chromeFinding, measureConsumer } from "./chrome-census.mjs"

// VDS144 — the chrome field in consumers.json, measured rather than typed. The
// rules run over fixture checkouts here, and the real register is held to the
// real checkouts where this machine has them.

const root = resolve(import.meta.dirname, "..")
const PKG = "@viglet/viglet-design-system"

let checkout: string

function write(relative: string, source: string) {
  const full = join(checkout, relative)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, source)
}

beforeEach(() => {
  checkout = mkdtempSync(join(tmpdir(), "vds-chrome-census-"))
})

afterEach(() => {
  rmSync(checkout, { recursive: true, force: true })
})

describe("measuring a consumer", () => {
  it("counts files taking a console-era name from the package or through a shim", () => {
    // The shim is the sanctioned one-line re-export; the pages import from it.
    write("src/components/sub-page-header.ts", `export { SubPageHeader } from "${PKG}/router"\n`)
    write("src/app/a.page.tsx", `import { SubPageHeader } from "@/components/sub-page-header"\n`)
    write("src/app/b.page.tsx", `import { SubPageHeader } from "@/components/sub-page-header"\n`)
    write("src/app/c.page.tsx", `import { BlankSlate, DialogDelete } from "${PKG}/router"\n`)
    // Bento, a neutral export, a test and a product's own unrelated name do not count.
    write("src/app/d.page.tsx", `import { BentoHero } from "${PKG}/bento"\nimport { GridList } from "./grid"\n`)
    write("src/app/c.page.test.tsx", `import { PageHeader } from "${PKG}/router"\n`)

    const measured = measureConsumer(checkout, ["src"])
    expect(measured.files).toEqual({ SubPageHeader: 2, BlankSlate: 1 })
    expect(measured.total).toBe(3)
  })
})

describe("reading a console-era import as a regression", () => {
  // VDS146 — `console` and `mixed` left the vocabulary with the era they named.
  // The components are gone from the package, so no declaration agrees with a
  // file still importing one: the count alone is the finding.
  const consumer = (chrome: string, entries: string[]) => ({ id: "fixture", chrome, entries })
  const some = { scanned: 3, files: { SubPageHeader: 2 }, total: 2 }
  const none = { scanned: 3, files: {}, total: 0 }

  it("reports a counted console-era name whatever the consumer declares", () => {
    for (const chrome of ["console", "mixed", "bento", "platform-console"]) {
      expect(chromeFinding(consumer(chrome, [".", "./bento"]), some)).toMatch(
        /takes console-era chrome in 2 source file\(s\) \(SubPageHeader 2\)/,
      )
    }
  })

  it("names what a product author searches for: the import, not the declaration", () => {
    const finding = chromeFinding(consumer("bento", ["."]), some)
    expect(finding).toContain("SubPageHeader")
    expect(finding).not.toContain("declare it")
  })

  it("says nothing about a consumer that takes none, whatever chrome it renders", () => {
    for (const chrome of ["bento", "docs-site", "platform-home", "console"]) {
      expect(chromeFinding(consumer(chrome, ["./bento"]), none)).toBeNull()
    }
  })

  it("lists the consumers it measured on the era, and which it could not measure", () => {
    write("package.json", "{}")
    write("src/app/a.page.tsx", `import { PageHeader } from "${PKG}/router"\n`)
    const register = {
      consumers: [
        { id: "measured", chrome: "bento", entries: ["."], sourceRoots: ["src"], checkout },
        { id: "away", chrome: "bento", entries: ["./bento"], sourceRoots: ["src"], offMachine: true },
      ],
    }

    const result = census(register, root, "2026.3")
    expect(result.rows.map((r: { id: string; finding: string | null }) => r.finding)).toHaveLength(1)
    expect(result.rows[0].finding).toMatch(/PageHeader 1/)
    expect(result.notMeasured).toEqual(["away"])
    // A consumer nobody measured is never on this list — which is why the
    // summary line prints how many were measured beside it.
    expect(result.consoles).toEqual(["measured"])
  })
})

// A developer's machine has the checkouts; CI has only this repository.
describe.skipIf(Boolean(process.env.CI))("the register on this machine", () => {
  it("finds no consumer reaching for a component the console era took with it", () => {
    const register = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8"))
    const line = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version.split(".").slice(0, 2).join(".")
    const result = census(register, root, line)
    expect(result.rows.length, "no consumer is checked out beside this repository").toBeGreaterThan(0)
    expect(result.rows.map((r: { finding: string | null }) => r.finding).filter(Boolean)).toEqual([])
  })
})
