import { spawn } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { findComponents, handle, renderComponent, renderTokens, TOOLS } from "./mcp.mjs"

// VDS136 — the catalogue served over MCP. The protocol is exercised as a client
// uses it, a process spoken to over stdio one line at a time; the ranking and
// the rendering are pure and tested directly.
//
// The catalogue is a fixture rather than dist/catalogue.json: the test job runs
// before the build job, and the real one is measured by check-catalogue.mjs at
// the end of the build instead.

const cli = resolve(import.meta.dirname, "mcp.mjs")

const CATALOGUE = {
  name: "@viglet/viglet-design-system",
  version: "0.0.0-fixture",
  components: [
    {
      name: "BentoPanel",
      specifier: "@viglet/viglet-design-system/bento",
      summary: "A frosted container with no heading.",
      description: "A frosted container with no heading. The one container in the layer without a title.",
      deprecated: null,
      example: null,
      props: [
        { name: "children", type: "ReactNode", optional: false, summary: "" },
        { name: "tone", type: '"slate" | "blue"', optional: false, summary: "The chip colour." },
        { name: "className", type: "string", optional: true, summary: "On the frosted container." },
      ],
      inheritedProps: 0,
      rules: ["BENTO-AUTHORING §2 Structure"],
    },
    {
      name: "DialogDelete",
      specifier: "@viglet/viglet-design-system/router",
      summary: "",
      description: "",
      deprecated: null,
      example: null,
      props: [],
      inheritedProps: 0,
      rules: [],
    },
    {
      name: "PageHeader",
      specifier: "@viglet/viglet-design-system/router",
      summary: "A page heading with a frosted panel behind it.",
      description: "",
      deprecated: "Use BentoHero.",
      example: null,
      props: [],
      inheritedProps: 12,
      rules: [],
    },
  ],
  excluded: [],
}

let dir: string
let catalogue: string

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "vds-mcp-"))
  catalogue = join(dir, "dist", "catalogue.json")
  mkdirSync(join(dir, "dist"), { recursive: true })
  mkdirSync(join(dir, "docs"), { recursive: true })
  writeFileSync(catalogue, JSON.stringify(CATALOGUE))
  writeFileSync(join(dir, "docs", "BENTO-AUTHORING.md"), "# Authoring a bento page\n\nAdopt the shell.\n")
  writeFileSync(join(dir, "docs", "BENTO-BOUNDARY.md"), "# Boundary\n")
  writeFileSync(
    join(dir, "dist", "preset.css"),
    ":root {\n  /* the accent */\n  --vg-accent-from: oklch(62% 0.2 260);\n  --primary: var(--vg-primary);\n}\n\n.dark,\n[data-theme=\"dark\"] {\n  --vg-accent-from: oklch(70% 0.16 255);\n}\n",
  )
})

afterAll(() => {
  rmSync(dir, { recursive: true, force: true })
})

/** Speak to the server as a client does: one JSON line in, one out, per request. */
async function session(lines: object[]) {
  const child = spawn(process.execPath, [cli, "--package-root", dir])
  let out = ""
  child.stdout.on("data", (chunk) => (out += chunk))
  for (const line of lines) child.stdin.write(`${JSON.stringify(line)}\n`)
  child.stdin.end()
  await new Promise((done) => child.on("close", done))
  return out.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
}

describe("viglet-ds-mcp over stdio", () => {
  it("initializes, lists two tools, and answers a call", async () => {
    const replies = await session([
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } },
      { jsonrpc: "2.0", method: "notifications/initialized" },
      { jsonrpc: "2.0", id: 2, method: "tools/list" },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "find_component", arguments: { job: "frosted panel" } } },
    ])

    // The notification is answered by nothing, so three replies for three requests.
    expect(replies.map((r) => r.id)).toEqual([1, 2, 3])
    expect(replies[0].result).toMatchObject({
      protocolVersion: "2025-06-18",
      capabilities: { tools: {}, resources: {} },
      serverInfo: { name: "viglet-ds", version: "0.0.0-fixture" },
    })
    expect(replies[1].result.tools.map((t: { name: string }) => t.name)).toEqual(["find_component", "read_component"])
    expect(replies[2].result.content[0].text).toMatch(/^BentoPanel \(@viglet\/viglet-design-system\/bento\)/)
  })

  it("serves the contract and the tokens as resources", async () => {
    const [list, authoring, tokens] = await session([
      { jsonrpc: "2.0", id: 1, method: "resources/list" },
      { jsonrpc: "2.0", id: 2, method: "resources/read", params: { uri: "viglet-ds://authoring" } },
      { jsonrpc: "2.0", id: 3, method: "resources/read", params: { uri: "viglet-ds://tokens" } },
    ])

    expect(list.result.resources.map((r: { uri: string }) => r.uri)).toEqual([
      "viglet-ds://authoring",
      "viglet-ds://boundary",
      "viglet-ds://tokens",
    ])
    // Where the file lives is the server's business, not the client's.
    expect(list.result.resources[0]).not.toHaveProperty("file")
    expect(authoring.result.contents[0].text).toContain("Adopt the shell.")
    expect(tokens.result.contents[0].text).toContain("--vg-accent-from: oklch(70% 0.16 255)")
  })

  it("answers an unknown method or tool with an error, and survives a line it cannot parse", async () => {
    const child = spawn(process.execPath, [cli, "--package-root", dir])
    let out = ""
    child.stdout.on("data", (chunk) => (out += chunk))
    child.stdin.write("\uFEFF" + JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) + "\n")
    child.stdin.write("not json\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 2, method: "prompts/list" }) + "\n")
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } }) + "\n")
    child.stdin.end()
    await new Promise((done) => child.on("close", done))
    const replies = out.trim().split("\n").map((line) => JSON.parse(line))

    expect(replies[0]).toMatchObject({ id: 1, result: {} })
    expect(replies[1]).toMatchObject({ id: null, error: { code: -32700 } })
    expect(replies[2]).toMatchObject({ id: 2, error: { code: -32601 } })
    expect(replies[3]).toMatchObject({ id: 3, error: { code: -32602 } })
  })

  it("says the release has no catalogue rather than failing the session", async () => {
    const empty = mkdtempSync(join(tmpdir(), "vds-mcp-empty-"))
    try {
      const child = spawn(process.execPath, [cli, "--package-root", empty])
      let out = ""
      child.stdout.on("data", (chunk) => (out += chunk))
      child.stdin.end(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "find_component", arguments: { job: "panel" } } })}\n`)
      await new Promise((done) => child.on("close", done))
      const answer = JSON.parse(out.trim())
      expect(answer.result.isError).toBe(true)
      expect(answer.result.content[0].text).toContain("does not ship one")
    } finally {
      rmSync(empty, { recursive: true, force: true })
    }
  })
})

describe("the answers", () => {
  it("ranks by name and purpose, and puts a deprecated component behind its replacement", () => {
    const found = findComponents(CATALOGUE, "frosted panel").map((c: { name: string }) => c.name)
    expect(found[0]).toBe("BentoPanel")
    expect(found.indexOf("PageHeader")).toBeGreaterThan(found.indexOf("BentoPanel"))
    // A stem, so the job's word need not be the name's.
    expect(findComponents(CATALOGUE, "confirm before deleting")[0].name).toBe("DialogDelete")
    expect(findComponents(CATALOGUE, "the a of")).toEqual([])
  })

  it("renders a component with its props, its rules and an import that type-checks", () => {
    const text = renderComponent(CATALOGUE.components[0])
    expect(text).toContain("import from @viglet/viglet-design-system/bento")
    expect(text).toContain("- tone: \"slate\" | \"blue\" — The chip colour.")
    expect(text).toContain("- className?: string")
    expect(text).toContain("- BENTO-AUTHORING §2 Structure")
    // Required props other than children, as placeholders.
    expect(text).toContain('<BentoPanel tone={…} />')

    const deprecated = renderComponent(CATALOGUE.components[2])
    expect(deprecated).toContain("DEPRECATED: Use BentoHero.")
    expect(deprecated).toContain("and 12 attributes of the element it renders")
  })

  it("names a near component when asked for one that does not exist", () => {
    const answer = handle(
      { method: "tools/call", params: { name: "read_component", arguments: { name: "FrostedPanel" } } },
      CATALOGUE,
    ) as { isError?: boolean; content: { text: string }[] }
    expect(answer.isError).toBe(true)
    expect(answer.content[0].text).toContain("Did you mean BentoPanel")
  })

  it("lists the tokens by ground and drops the comments", () => {
    const text = renderTokens(":root {\n  /* x */\n  --vg-a: 1;\n}\n.dark {\n  --vg-a: 2;\n}\n")
    expect(text).toContain("## Light ground (:root)\n--vg-a: 1")
    expect(text).toContain("## Dark ground (.dark)\n--vg-a: 2")
  })

  it("keeps the tool list to two tools with short descriptions", () => {
    // Every word here is in context on every turn; check-catalogue holds the real number.
    expect(TOOLS).toHaveLength(2)
    for (const tool of TOOLS) expect(tool.description.length).toBeLessThan(200)
  })
})
