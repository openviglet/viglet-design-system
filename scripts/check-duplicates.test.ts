import { execFileSync } from "node:child_process"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

// This CLI ships to every consumer — Turing, Shio, Dumont, the Cloud Console,
// the Cloud Home and Schools — and runs in the CI of the ones that have adopted
// it, so a change to its parsing turns a product's build red or, worse, silently
// green. It is exercised the way a consumer runs it — as a process, over files
// on disk — because the exit code and the printed replacement are the whole
// contract.
//
// The manifest is a fixture rather than this package's own dist/exports.json:
// the test job runs before the build job, so a test that needed dist would pass
// locally and fail in CI for a reason that has nothing to do with the code.

const cli = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "check-duplicates.mjs",
)

const MANIFEST = {
  name: "@viglet/viglet-design-system",
  version: "0.0.0-fixture",
  entries: {
    ".": {
      specifier: "@viglet/viglet-design-system",
      values: ["Button", "AppFooter"],
      types: ["VigUser"],
    },
    "./router": {
      specifier: "@viglet/viglet-design-system/router",
      values: ["PageHeader", "Button"],
      types: [],
    },
  },
}

let workdir: string
let manifest: string

function write(relative: string, source: string) {
  const full = join(workdir, relative)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, source)
}

function run(...args: string[]) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [cli, "src", "--manifest", manifest, ...args],
      { cwd: workdir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
    return { status: 0, stdout }
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string }
    return { status: failure.status, stdout: failure.stdout, stderr: failure.stderr }
  }
}

function findings(...args: string[]) {
  const { stdout } = run("--json", ...args)
  return JSON.parse(stdout).findings as {
    file: string
    line: number
    name: string
    replacement: string
  }[]
}

beforeAll(() => {
  workdir = mkdtempSync(join(tmpdir(), "vds-dup-"))
  manifest = join(workdir, "manifest.json")
  writeFileSync(manifest, JSON.stringify(MANIFEST))
  writeFileSync(join(workdir, "package.json"), '{"name":"fixture","version":"1.0.0"}')
})

afterAll(() => {
  rmSync(workdir, { recursive: true, force: true })
})

describe("viglet-ds-check-duplicates", () => {
  it("finds a redeclared component and names the import that replaces it", () => {
    write("src/button.tsx", "export function Button() { return null }\n")

    const found = findings()
    expect(found).toHaveLength(1)
    expect(found[0]).toMatchObject({
      name: "Button",
      line: 1,
      replacement: 'import { Button } from "@viglet/viglet-design-system"',
    })
  })

  it("exits non-zero on a finding, and zero under --warn", () => {
    expect(run().status).toBe(1)
    expect(run("--warn").status).toBe(0)
  })

  it("prefers the root entry when a name is exported from two of them", () => {
    // Button is in both "." and "./router"; a product would import the root.
    expect(findings()[0].replacement).toContain('from "@viglet/viglet-design-system"')
  })

  it("names the subpath for something only that entry exports", () => {
    write("src/page-header.tsx", "export const PageHeader = () => null\n")

    const found = findings().find((f) => f.name === "PageHeader")
    expect(found?.replacement).toBe(
      'import { PageHeader } from "@viglet/viglet-design-system/router"',
    )
  })

  it("writes a type import for a type-only export", () => {
    write("src/models.ts", "export interface VigUser { id: string }\n")

    const found = findings().find((f) => f.name === "VigUser")
    expect(found?.replacement).toBe(
      'import type { VigUser } from "@viglet/viglet-design-system"',
    )
  })

  it("skips a re-export shim, which is the sanctioned pattern", () => {
    write("src/shim.ts", 'export { AppFooter } from "@viglet/viglet-design-system"\n')

    expect(findings().some((f) => f.file.endsWith("shim.ts"))).toBe(false)
  })

  it("honours an allow pragma, per name and per file", () => {
    write(
      "src/app-footer.tsx",
      "// viglet-ds-allow-duplicate AppFooter -- renders this product's build version\n" +
        "export function AppFooter() { return null }\n",
    )

    expect(findings().some((f) => f.name === "AppFooter")).toBe(false)
  })

  it("keeps flagging a name the pragma does not cover in the same file", () => {
    write(
      "src/mixed.tsx",
      "// viglet-ds-allow-duplicate AppFooter -- deliberate\n" +
        "export function AppFooter() { return null }\n" +
        "export function Button() { return null }\n",
    )

    const inFile = findings().filter((f) => f.file.endsWith("mixed.tsx"))
    expect(inFile.map((f) => f.name)).toEqual(["Button"])
  })

  it("leaves a name this package does not export alone", () => {
    write("src/local-only.tsx", "export function QuotaTile() { return null }\n")

    expect(findings().some((f) => f.name === "QuotaTile")).toBe(false)
  })

  it("reads the names inside a local export list", () => {
    write(
      "src/barrel.ts",
      "const internal = 1\nexport { internal as Button }\n",
    )

    expect(findings().some((f) => f.file.endsWith("barrel.ts"))).toBe(true)
  })

  it("refuses a manifest path that is not there rather than passing vacuously", () => {
    // Invoked without run(), which would supply the real fixture first and win.
    let status = 0
    let stderr = ""
    try {
      execFileSync(
        process.execPath,
        [cli, "src", "--manifest", join(workdir, "missing.json")],
        { cwd: workdir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      )
    } catch (error) {
      const failure = error as { status: number; stderr: string }
      status = failure.status
      stderr = failure.stderr
    }

    expect(status).toBe(1)
    expect(stderr).toContain("no manifest")
  })
})
