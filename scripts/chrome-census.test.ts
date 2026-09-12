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

describe("holding the chrome field to the measurement", () => {
  const consumer = (chrome: string, entries: string[]) => ({ id: "fixture", chrome, entries })
  const some = { scanned: 3, files: { SubPageHeader: 2 }, total: 2 }
  const none = { scanned: 3, files: {}, total: 0 }

  it("calls a consumer that takes console-era chrome console, or mixed when it takes bento too", () => {
    expect(chromeFinding(consumer("console", ["."]), some)).toBeNull()
    expect(chromeFinding(consumer("mixed", [".", "./bento"]), some)).toBeNull()
    expect(chromeFinding(consumer("bento", [".", "./bento"]), some)).toMatch(/declared "bento".*declare it "mixed"/)
    expect(chromeFinding(consumer("console", [".", "./bento"]), some)).toMatch(/declare it "mixed"/)
  })

  it("refuses console or mixed for a consumer that takes none", () => {
    expect(chromeFinding(consumer("console", ["."]), none)).toMatch(/no source file takes console-era chrome/)
    expect(chromeFinding(consumer("mixed", ["./bento"]), none)).toMatch(/no source file/)
    expect(chromeFinding(consumer("bento", ["./bento"]), none)).toBeNull()
    expect(chromeFinding(consumer("docs-site", ["./preset"]), none)).toBeNull()
  })

  it("reports which consumers are still on console-era chrome, and which it could not measure", () => {
    write("package.json", "{}")
    write("src/app/a.page.tsx", `import { PageHeader } from "${PKG}/router"\n`)
    const register = {
      consumers: [
        { id: "measured", chrome: "console", entries: ["."], sourceRoots: ["src"], checkout },
        { id: "away", chrome: "bento", entries: ["./bento"], sourceRoots: ["src"], offMachine: true },
      ],
    }

    const result = census(register, root, "2026.3")
    expect(result.rows.map((r: { id: string; finding: string | null }) => [r.id, r.finding])).toEqual([["measured", null]])
    expect(result.notMeasured).toEqual(["away"])
    expect(result.consoles).toEqual(["measured"])
  })
})

// A developer's machine has the checkouts; CI has only this repository.
describe.skipIf(Boolean(process.env.CI))("the register on this machine", () => {
  it("declares every consumer's chrome the way its source measures", () => {
    const register = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8"))
    const line = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version.split(".").slice(0, 2).join(".")
    const result = census(register, root, line)
    expect(result.rows.length, "no consumer is checked out beside this repository").toBeGreaterThan(0)
    expect(result.rows.map((r: { finding: string | null }) => r.finding).filter(Boolean)).toEqual([])
  })
})
