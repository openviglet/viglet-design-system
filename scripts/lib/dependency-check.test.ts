import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import {
  describeFindings,
  resolveInstalledVersion,
  unsatisfiedDependencies,
} from "./dependency-check.mjs"

// The check this file guards exists because the tool it belongs to produced a
// confident, wrong answer: a product build failed on a dependency the package
// had already moved off, and it read as a defect in the change under test. So
// the comparison is asserted directly, including the resolution walk — which is
// the half that was got wrong the first time, by rooting a lookup at a symlink
// and finding the consumer's copy instead of the package's own.

describe("unsatisfiedDependencies", () => {
  const at = (versions: Record<string, string | null>) => () => (_dir: string, name: string) =>
    versions[name] ?? null

  it("says nothing when every installed version satisfies its range", () => {
    const resolve = at({ react: "19.2.8", axios: "1.19.0" })()

    expect(
      unsatisfiedDependencies({ react: "^19.0.0", axios: "^1.13.6" }, "/pkg", resolve),
    ).toEqual([])
  })

  it("reports a major behind the range, which is the case that breaks a build", () => {
    const resolve = at({ "@tanstack/react-table": "8.21.3" })()

    const found = unsatisfiedDependencies(
      { "@tanstack/react-table": "^9.1.2" },
      "/pkg",
      resolve,
    )

    expect(found).toEqual([
      {
        name: "@tanstack/react-table",
        range: "^9.1.2",
        installed: "8.21.3",
        kind: "mismatch",
      },
    ])
  })

  it("reports a minor behind a caret range too", () => {
    const resolve = at({ axios: "1.12.0" })()

    expect(unsatisfiedDependencies({ axios: "^1.13.6" }, "/pkg", resolve)[0]).toMatchObject({
      kind: "mismatch",
    })
  })

  it("accepts an installed version ahead within the same major", () => {
    const resolve = at({ axios: "1.19.0" })()

    expect(unsatisfiedDependencies({ axios: "^1.13.6" }, "/pkg", resolve)).toEqual([])
  })

  it("marks a dependency the tree does not have as missing, not as a mismatch", () => {
    const resolve = at({ axios: null })()

    expect(unsatisfiedDependencies({ axios: "^1.13.6" }, "/pkg", resolve)).toEqual([
      { name: "axios", range: "^1.13.6", installed: null, kind: "missing" },
    ])
  })

  it("stays quiet on a range it cannot parse rather than inventing a finding", () => {
    const resolve = at({ thing: "1.0.0" })()

    expect(unsatisfiedDependencies({ thing: "workspace:*" }, "/pkg", resolve)).toEqual([])
  })

  it("handles an empty or absent dependency map", () => {
    expect(unsatisfiedDependencies({}, "/pkg", () => null)).toEqual([])
    expect(unsatisfiedDependencies(undefined, "/pkg", () => null)).toEqual([])
  })
})

describe("describeFindings", () => {
  it("returns null when there is nothing to say", () => {
    expect(describeFindings([], "/consumer")).toBeNull()
    expect(
      describeFindings([{ name: "x", range: "^1", installed: null, kind: "missing" }], "/c"),
    ).toBeNull()
  })

  it("names the package, the range and what is installed, and what to do", () => {
    const message = describeFindings(
      [{ name: "@tanstack/react-table", range: "^9.1.2", installed: "8.21.3", kind: "mismatch" }],
      "d:/products/turing",
    )!

    expect(message).toContain("d:/products/turing")
    expect(message).toContain("@tanstack/react-table  needs ^9.1.2, installed 8.21.3")
    expect(message).toContain("--skip-dep-check")
  })
})

describe("resolveInstalledVersion", () => {
  let root: string

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "vds-resolve-"))

    // A pnpm-shaped tree: the package sits in its own directory with its own
    // node_modules beside it, under a store that also holds another version.
    const pkgDir = join(root, "store", "ds@1", "node_modules", "@viglet", "ds")
    const write = (path: string, version: string) => {
      mkdirSync(dirname(path), { recursive: true })
      writeFileSync(path, JSON.stringify({ version }))
    }
    write(join(pkgDir, "package.json"), "1.0.0")
    write(
      join(root, "store", "ds@1", "node_modules", "@tanstack", "react-table", "package.json"),
      "9.1.2",
    )
    // What a consumer higher up the tree has, which must not be picked.
    write(join(root, "node_modules", "@tanstack", "react-table", "package.json"), "8.21.3")
    // Reachable only by climbing, which is the other half of the walk.
    write(join(root, "node_modules", "only-at-root", "package.json"), "2.0.0")
  })

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it("finds the version beside the package, not the one further up", () => {
    const pkgDir = join(root, "store", "ds@1", "node_modules", "@viglet", "ds")

    expect(resolveInstalledVersion(pkgDir, "@tanstack/react-table")).toBe("9.1.2")
  })

  it("falls back to an ancestor when the package has no copy of its own", () => {
    const pkgDir = join(root, "store", "ds@1", "node_modules", "@viglet", "ds")

    // `only-at-root` exists nowhere near the package, so the walk has to climb.
    expect(resolveInstalledVersion(pkgDir, "only-at-root")).toBe("2.0.0")
  })

  it("returns null for something no ancestor has either", () => {
    const pkgDir = join(root, "store", "ds@1", "node_modules", "@viglet", "ds")

    expect(resolveInstalledVersion(pkgDir, "nothing-here")).toBeNull()
  })
})
