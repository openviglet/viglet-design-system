import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

// This CLI writes into somebody else's repository, which is the reason it is
// tested as a process over files on disk rather than by importing anything: the
// exit code, what lands and what is left alone are the whole contract. A change
// that quietly stopped preserving an adopter's own canvas entries would not fail
// here in any other shape.
//
// The payload is this checkout's real docs/reference, not a fixture. That is
// deliberate: the surfaces are the package's statement, and a fixture would let
// the two drift apart with the test still green.

const cli = resolve(dirname(fileURLToPath(import.meta.url)), "page-reference.mjs")
const version = JSON.parse(
  readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"),
).version as string

const SKILL = ".claude/skills/viglet-ds-pages/SKILL.md"

let root: string

function run(...args: string[]) {
  try {
    const stdout = execFileSync(process.execPath, [cli, "--root", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
    return { status: 0, stdout }
  } catch (error) {
    const failure = error as { status: number; stdout: string; stderr: string }
    return { status: failure.status, stdout: `${failure.stdout}${failure.stderr}` }
  }
}

function write(relative: string, source: string) {
  const full = join(root, relative)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, source, "utf8")
}

function read(relative: string) {
  return readFileSync(join(root, relative), "utf8")
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "vds-page-reference-"))
})

afterEach(() => {
  rmSync(root, { recursive: true, force: true })
})

describe("vendoring the page reference", () => {
  it("names what an unwired repository is missing, and refuses", () => {
    const { status, stdout } = run("--check")

    expect(status).toBe(1)
    expect(stdout).toContain("page-reference.absent")
    // The concrete loss, not "a file is missing".
    expect(stdout).toContain("the shell")
  })

  it("writes the contract, the artboards and the manifest, then reports current", () => {
    expect(run().status).toBe(0)

    expect(read(SKILL)).toContain(`vds-version: ${version}`)
    // The two reference pages are the package's own documents, verbatim.
    expect(read(".claude/skills/viglet-ds-pages/authoring.md")).toContain("Adopt the shell")
    expect(existsSync(join(root, ".claude/skills/viglet-ds-pages/boundary.md"))).toBe(true)
    expect(existsSync(join(root, "docs/design/vds-page-anatomy.dc.html"))).toBe(true)

    const second = run("--check")
    expect(second.status).toBe(0)
    expect(second.stdout).toContain("current")
  })

  it("keeps an adopter's own canvas entries and adds its own beside them", () => {
    write(
      "docs/design/canvas.json",
      `${JSON.stringify(
        {
          pages: [{ id: "page-1", name: "Screens" }],
          artboards: [{ file: "Main.dc.html", x: 0, y: 0, w: 1440, h: 900, page: "page-1" }],
          annotations: [{ id: "note-1", page: "page-1", x: 0, y: -100, w: 300, text: "mine" }],
          launch: { view: "canvas", page: "page-1" },
        },
        null,
        2,
      )}\n`,
    )
    write("docs/design/Main.dc.html", "<!-- mine -->")

    expect(run().status).toBe(0)

    const canvas = JSON.parse(read("docs/design/canvas.json")) as {
      pages: { id: string }[]
      artboards: { file: string }[]
      annotations: { id: string }[]
      launch: { page: string }
    }

    expect(canvas.pages.map((p) => p.id)).toContain("page-1")
    expect(canvas.artboards.map((a) => a.file)).toContain("Main.dc.html")
    expect(canvas.annotations.map((n) => n.id)).toContain("note-1")
    // Their opening view survives: ours is only a default.
    expect(canvas.launch.page).toBe("page-1")
    // And every artboard of the package's is prefixed, so a name can never collide.
    const ours = canvas.artboards.filter((a) => a.file.startsWith("vds-"))
    expect(ours.length).toBeGreaterThan(4)
    expect(read("docs/design/Main.dc.html")).toBe("<!-- mine -->")
  })

  it("reports a hand-edited copy and rewrites it", () => {
    run()
    write(".claude/skills/viglet-ds-pages/authoring.md", "a local edit")

    const drifted = run("--check")
    expect(drifted.status).toBe(1)
    expect(drifted.stdout).toContain("page-reference.stale")
    expect(drifted.stdout).toContain("authoring.md")

    expect(run().status).toBe(0)
    expect(read(".claude/skills/viglet-ds-pages/authoring.md")).not.toBe("a local edit")
  })

  it("reports and removes an artboard the package no longer ships", () => {
    run()
    write("docs/design/vds-gone.dc.html", "<!-- dropped upstream -->")

    const stale = run("--check")
    expect(stale.status).toBe(1)
    expect(stale.stdout).toContain("would remove")

    expect(run().status).toBe(0)
    expect(existsSync(join(root, "docs/design/vds-gone.dc.html"))).toBe(false)
  })

  it("refuses to write over surfaces a newer package wrote", () => {
    run()
    write(SKILL, read(SKILL).replace(`vds-version: ${version}`, "vds-version: 9999.9.9"))

    const { status, stdout } = run("--check")
    expect(status).toBe(1)
    expect(stdout).toContain("ahead, not behind")
  })

  it("refuses a canvas.json it cannot merge into, and writes nothing", () => {
    write("docs/design/canvas.json", "not json at all")

    const { status, stdout } = run()
    expect(status).toBe(1)
    expect(stdout).toContain("canvas.json")
    expect(existsSync(join(root, SKILL))).toBe(false)
  })

  it("still exits 0 under --warn, so a repository can adopt the gate before the fix", () => {
    expect(run("--check", "--warn").status).toBe(0)
  })

  it("answers in JSON, with the code a gate would report", () => {
    const before = JSON.parse(run("--check", "--json").stdout) as {
      code: string
      wired: boolean
      surfaces: { to: string; state: string }[]
    }
    expect(before.wired).toBe(false)
    expect(before.code).toBe("page-reference.absent")
    expect(before.surfaces.every((s) => s.state === "would create")).toBe(true)

    run()
    const after = JSON.parse(run("--check", "--json").stdout) as { code: string | null }
    expect(after.code).toBeNull()
  })
})
