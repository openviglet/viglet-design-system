import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { contentAfter, withinRange } from "../claude-plugin/hooks/duplicate-guard.mjs"

// VDS135 — the design system as a Claude Code plugin.
//
// A plugin is loaded by another program on somebody else's machine. A skill with
// no description never triggers, a manifest path that is not there fails the
// install, and a hook that crashes shows an error on every write; none of that
// shows up in this repository's own build. So the manifests are read and every
// path they name is checked, and the hook is run as the harness runs it: a
// process fed a payload on stdin.

const root = resolve(import.meta.dirname, "..")
const plugin = join(root, "claude-plugin")
const guard = join(plugin, "hooks", "duplicate-guard.mjs")

const json = (path: string) => JSON.parse(readFileSync(path, "utf8"))

/** The `---` block at the top of a skill or a command, as key -> value. */
function frontmatter(text: string): Record<string, string> {
  expect(text.startsWith("---\n"), "the file must open with a frontmatter block").toBe(true)
  const end = text.indexOf("\n---", 4)
  expect(end, "the frontmatter block must be closed").toBeGreaterThan(0)
  const fields: Record<string, string> = {}
  for (const line of text.slice(4, end).split("\n")) {
    const cut = line.indexOf(":")
    if (cut > 0) fields[line.slice(0, cut).trim()] = line.slice(cut + 1).trim()
  }
  return fields
}

describe("the plugin's manifests", () => {
  it("identify the plugin", () => {
    const manifest = json(join(plugin, ".claude-plugin", "plugin.json"))
    expect(manifest.name).toBe("viglet-ds")
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/)
    expect(manifest.description.length, "the description is what `claude plugin list` shows").toBeGreaterThan(80)
    expect(manifest.license).toBe(json(join(root, "package.json")).license)
  })

  it("list it in the marketplace, by a path that holds it", () => {
    const marketplace = json(join(root, ".claude-plugin", "marketplace.json"))
    expect(marketplace.plugins.map((p: { name: string }) => p.name)).toEqual(["viglet-ds"])
    const source = join(root, marketplace.plugins[0].source)
    expect(existsSync(join(source, ".claude-plugin", "plugin.json"))).toBe(true)
  })

  it("wire a hook to a script that is there", () => {
    const hooks = json(join(plugin, "hooks", "hooks.json")).hooks
    const commands = Object.values(hooks as Record<string, { hooks: { command: string }[] }[]>)
      .flat()
      .flatMap((entry) => entry.hooks.map((hook) => hook.command))
    expect(commands.length).toBeGreaterThan(0)
    for (const command of commands) {
      const paths = [...command.matchAll(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"\s]+)/g)].map((m) => m[1])
      expect(paths.length, `${command} names no file in the plugin`).toBeGreaterThan(0)
      for (const path of paths) expect(existsSync(join(plugin, path)), `${path} is not in the plugin`).toBe(true)
    }
  })

  it("declare each skill with the name and the trigger that load it", () => {
    const skills = readdirSync(join(plugin, "skills"))
    expect(skills).toEqual(["viglet-ds-pages"])
    for (const name of skills) {
      const text = readFileSync(join(plugin, "skills", name, "SKILL.md"), "utf8")
      const fields = frontmatter(text)
      expect(fields.name).toBe(name)
      expect(fields.description?.length).toBeGreaterThan(80)
      expect(fields.description).toMatch(/use when/i)
      for (const [, link] of text.matchAll(/\]\(([^)#]+\.md)\)/g)) {
        expect(existsSync(join(plugin, "skills", name, link)), `${name} links ${link}, which is not there`).toBe(true)
      }
    }
  })

  // VDS136 — the catalogue server, started from the consumer's own install.
  it("wire the MCP server to the bin the package ships", () => {
    const server = json(join(plugin, ".mcp.json")).mcpServers["viglet-ds"]
    expect(server, "the skill names the server viglet-ds").toBeDefined()
    const bins = Object.keys(json(join(root, "package.json")).bin)
    expect(bins).toContain(server.args.at(-1))
    // Never fetched from the registry: the server has to describe the release
    // the product installed, not whichever is newest.
    expect(server.args).toContain("--no-install")
  })

  it("give the check command every check bin the package ships", () => {
    const text = readFileSync(join(plugin, "commands", "viglet-ds-check.md"), "utf8")
    expect(frontmatter(text).description).toBeTruthy()
    // A check added to the package and not to the command is a check no session
    // runs. The server is served by .mcp.json, not run as a check.
    const served = new Set(Object.values(json(join(plugin, ".mcp.json")).mcpServers).map((s) => (s as { args: string[] }).args.at(-1)))
    for (const bin of Object.keys(json(join(root, "package.json")).bin).filter((b) => !served.has(b))) {
      expect(text, `the check command does not run ${bin}`).toContain(bin)
    }
    expect(text).toMatch(/Do not fix anything without asking/)
  })

  it("keep the skill a pointer at the server, not a copy of the contract", () => {
    // The contract used to travel as two copied documents. The server reads the
    // installed package's own, so a copy here would be the one that drifts.
    expect(readdirSync(join(plugin, "skills", "viglet-ds-pages"))).toEqual(["SKILL.md"])
    const skill = readFileSync(join(plugin, "skills", "viglet-ds-pages", "SKILL.md"), "utf8")
    for (const pointer of ["find_component", "read_component", "viglet-ds://authoring", "viglet-ds://boundary"]) {
      expect(skill).toContain(pointer)
    }
  })

  it("support the line this checkout is cut from, and not the next", () => {
    const range = json(join(plugin, "package.json")).supportedPackage["@viglet/viglet-design-system"]
    const [year, minor] = json(join(root, "package.json")).version.split(".").map(Number)
    expect(withinRange(`${year}.${minor}.99`, range)).toBe(true)
    expect(withinRange(`${year}.${minor + 1}.0`, range)).toBe(false)

    // Not as a dependency: use:local reads any package.json that depends on the
    // package as a consumer to push into, and this directory is not one.
    const manifest = json(join(plugin, "package.json"))
    for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
      expect(manifest[field]?.["@viglet/viglet-design-system"], field).toBeUndefined()
    }
  })

  it("ship no internal task id in what the plugin itself writes", () => {
    // Everything under claude-plugin/ goes to installations with no access to this
    // roadmap, where an id reads as a term the reader is missing.
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)],
      )
    for (const file of walk(plugin)) {
      expect(readFileSync(file, "utf8").match(/VDS\d+/g) ?? [], file).toEqual([])
    }
  })
})

describe("the duplicate guard", () => {
  let consumer: string

  const MANIFEST = {
    name: "@viglet/viglet-design-system",
    version: "2026.3.12",
    entries: {
      ".": { specifier: "@viglet/viglet-design-system", values: ["Button"], types: [] },
    },
  }

  /** A consumer with the package installed, carrying the real check script. */
  function install(version = MANIFEST.version) {
    const installed = join(consumer, "node_modules", "@viglet", "viglet-design-system")
    mkdirSync(join(installed, "dist"), { recursive: true })
    mkdirSync(join(installed, "scripts"), { recursive: true })
    writeFileSync(
      join(installed, "package.json"),
      JSON.stringify({ name: MANIFEST.name, version, exports: { "./exports.json": "./dist/exports.json" } }),
    )
    writeFileSync(join(installed, "dist", "exports.json"), JSON.stringify({ ...MANIFEST, version }))
    copyFileSync(join(root, "scripts", "check-duplicates.mjs"), join(installed, "scripts", "check-duplicates.mjs"))
  }

  function hook(payload: object) {
    const run = spawnSync(process.execPath, [guard], {
      input: JSON.stringify({ hook_event_name: "PreToolUse", cwd: consumer, ...payload }),
      encoding: "utf8",
    })
    return { status: run.status, stdout: run.stdout, stderr: run.stderr }
  }

  const write = (file: string, content: string) =>
    hook({ tool_name: "Write", tool_input: { file_path: file, content } })

  beforeEach(() => {
    consumer = mkdtempSync(join(tmpdir(), "vds-plugin-guard-"))
    writeFileSync(join(consumer, "package.json"), '{"name":"fixture"}')
  })

  afterEach(() => {
    rmSync(consumer, { recursive: true, force: true })
  })

  it("denies a write that declares an exported name, and names the import", () => {
    install()
    const answer = write("src/components/button.tsx", "export function Button() { return null }\n")

    expect(answer.status).toBe(0)
    const decision = JSON.parse(answer.stdout).hookSpecificOutput
    expect(decision.permissionDecision).toBe("deny")
    expect(decision.permissionDecisionReason).toContain('import { Button } from "@viglet/viglet-design-system"')
    expect(decision.permissionDecisionReason).toContain("viglet-ds-allow-duplicate Button --")
  })

  it("says nothing, rather than allowing, where it has no opinion", () => {
    install()
    // A deliberate copy, a name the package does not export, a file that is not
    // source: each is left to the user's own permission rules.
    expect(write("src/button.tsx", "// viglet-ds-allow-duplicate Button -- ours\nexport function Button() {}\n").stdout).toBe("")
    expect(write("src/quota.tsx", "export function QuotaTile() {}\n").stdout).toBe("")
    expect(write("src/notes.md", "export function Button() {}\n").stdout).toBe("")
  })

  it("reads an edit as the file it would leave", () => {
    install()
    mkdirSync(join(consumer, "src"))
    writeFileSync(join(consumer, "src", "widgets.tsx"), "export function Local() {}\n")

    const answer = hook({
      tool_name: "Edit",
      tool_input: { file_path: "src/widgets.tsx", old_string: "Local", new_string: "Button" },
    })
    expect(JSON.parse(answer.stdout).hookSpecificOutput.permissionDecision).toBe("deny")

    expect(contentAfter("Edit", { file_path: join(consumer, "src", "widgets.tsx"), old_string: "absent", new_string: "x" })).toBeNull()
  })

  it("stays out of a repository without the package, or with a release outside its range", () => {
    expect(write("src/button.tsx", "export function Button() {}\n").stdout).toBe("")

    install("2026.4.0")
    expect(write("src/button.tsx", "export function Button() {}\n").stdout).toBe("")
  })

  it("never fails the write on a payload it cannot read", () => {
    const garbage = spawnSync(process.execPath, [guard], { input: "not json", encoding: "utf8" })
    expect(garbage.status).toBe(0)
    expect(garbage.stdout).toBe("")
  })
})
