import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

// VDS130 — `use:local` reads each consumer's checkout from the register. Run as
// a process with `--list`, which resolves and reports and writes nothing.

const cli = resolve(import.meta.dirname, "use-local.mjs")

let base: string
let register: string

function run(...args: string[]) {
  try {
    const stdout = execFileSync(process.execPath, [cli, ...args], {
      cwd: base,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, stdout, stderr: "" }
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string }
    return { status: failure.status, stdout: failure.stdout, stderr: failure.stderr }
  }
}

function declare(consumers: object[]) {
  writeFileSync(register, JSON.stringify({ consumers }))
}

/** A product that depends on the package and has it installed. */
function product(name: string) {
  const dir = join(base, name)
  const installed = join(dir, "node_modules", "@viglet", "viglet-design-system")
  mkdirSync(installed, { recursive: true })
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name, dependencies: { "@viglet/viglet-design-system": "*" } }),
  )
  writeFileSync(join(installed, "package.json"), '{"name":"@viglet/viglet-design-system"}')
  return dir
}

beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), "vds-use-local-"))
  register = join(base, "register.json")
})

afterEach(() => {
  rmSync(base, { recursive: true, force: true })
})

describe("use:local", () => {
  it("reaches a consumer through the checkout the register declares", () => {
    const dir = product("fixture-app")
    declare([{ id: "fixture", package: "fixture-app", checkout: dir }])

    const result = run("--list", "--register", register)
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(dir)
  })

  it("exits non-zero and names the register when no declared consumer is on this machine", () => {
    declare([{ id: "fixture", package: "fixture-app", checkout: join(base, "not-checked-out") }])

    const result = run("--list", "--register", register)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(register)
    expect(result.stderr).toContain("fixture declares checkout")
  })

  it("takes a consumer id as an argument, and refuses one whose checkout is absent", () => {
    const dir = product("fixture-app")
    declare([
      { id: "fixture", package: "fixture-app", checkout: dir },
      { id: "away", package: "away-app", offMachine: true },
    ])

    const named = run("fixture", "--list", "--register", register)
    expect(named.status).toBe(0)
    expect(named.stdout).toContain(dir)

    const absent = run("away", "--list", "--register", register)
    expect(absent.status).toBe(1)
    expect(absent.stderr).toContain("offMachine")
  })

  it("does not read the --register value as a consumer directory", () => {
    // The VDS78 shape: a flag's value filtered out by `indexOf + 1` only when present.
    const dir = product("fixture-app")
    declare([{ id: "fixture", package: "fixture-app", checkout: dir }])

    // Read as a directory, the register path would be the only consumer and the
    // declared checkout would never be reached.
    const result = run("--register", register, "--list")
    expect(result.status).toBe(0)
    expect(result.stdout).toContain(dir)
  })
})
