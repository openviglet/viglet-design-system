import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { checkoutPath, resolveCheckouts } from "./checkouts.mjs"

// VDS130 — the register says where each consumer is checked out, so `use:local`
// stops deriving a products root from where this repository happens to sit.

let base: string
let repoRoot: string

function packageAt(relative: string) {
  const dir = join(base, relative)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "package.json"), "{}")
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "vds-checkouts-"))
  repoRoot = join(base, "design-system", "2026.3")
  mkdirSync(repoRoot, { recursive: true })
})

afterEach(() => {
  rmSync(base, { recursive: true, force: true })
})

describe("resolveCheckouts", () => {
  it("resolves a checkout relative to this repository, with {line} as the version line", () => {
    expect(checkoutPath({ checkout: "../../product/{line}/app" }, repoRoot, "2026.3")).toBe(
      join(base, "product", "2026.3", "app"),
    )
    expect(checkoutPath({}, repoRoot, "2026.3")).toBeNull()
  })

  it("sorts consumers into found, missing and declared elsewhere", () => {
    packageAt("product/2026.3/app")
    packageAt("site")
    mkdirSync(join(base, "moved"), { recursive: true })

    const { found, missing, offMachine } = resolveCheckouts(
      {
        consumers: [
          { id: "product", checkout: "../../product/{line}/app" },
          { id: "site", checkout: "../../site" },
          // A directory with no package.json is the layout moving under the path.
          { id: "moved", checkout: "../../moved" },
          { id: "gone", checkout: "../../gone" },
          { id: "elsewhere", offMachine: true },
        ],
      },
      repoRoot,
      "2026.3",
    )

    expect(found.map((f: { consumer: { id: string } }) => f.consumer.id)).toEqual(["product", "site"])
    expect(missing.map((m: { consumer: { id: string } }) => m.consumer.id)).toEqual(["moved", "gone"])
    expect(offMachine.map((o: { consumer: { id: string } }) => o.consumer.id)).toEqual(["elsewhere"])
  })

  it("keeps an older worktree on its own line", () => {
    packageAt("product/2026.3/app")

    const { found, missing } = resolveCheckouts(
      { consumers: [{ id: "product", checkout: "../../product/{line}/app" }] },
      repoRoot,
      "2026.2",
    )
    expect(found).toEqual([])
    expect(missing[0].path).toBe(join(base, "product", "2026.2", "app"))
  })
})
