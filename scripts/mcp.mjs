#!/usr/bin/env node
// VDS136 — the component catalogue, served to an agent over MCP (stdio).
//
//   viglet-ds-mcp                         # serve the installed package's catalogue
//   viglet-ds-mcp --catalogue <file>      # serve another catalogue.json
//   viglet-ds-mcp --package-root <dir>    # read dist/ and docs/ from another copy
//
// Two tools, because a tool list is paid on every turn of every session:
//
//   find_component   which components do a job, ranked, one line each
//   read_component   one component's purpose, props, the rules that govern it
//                    and an import to start from
//
// The long text is a resource, read when a session asks for it: the authoring
// contract, the boundary, and the token reference. Everything is read from the
// installed package, so the answers describe the release the product has, and
// nothing here is written by hand: the catalogue is generated at build time from
// the declarations the product compiles against.
//
// The protocol is JSON-RPC 2.0, one message per line, with no SDK: initialize,
// ping, tools/list, tools/call, resources/list and resources/read are the whole
// of what a client asks this server.

import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"

const args = process.argv.slice(2)
function option(flag) {
  const at = args.indexOf(flag)
  return at === -1 ? null : (args[at + 1] ?? null)
}

const packageRoot = resolve(option("--package-root") ?? join(dirname(fileURLToPath(import.meta.url)), ".."))
const cataloguePath = resolve(option("--catalogue") ?? join(packageRoot, "dist", "catalogue.json"))

const PROTOCOL = "2025-06-18"
const FIND_LIMIT = 5

// ---------------------------------------------------------------------------
// The surface. Descriptions are short on purpose: each word here is in every
// turn's context, and the per-call answers carry the detail.

export const TOOLS = [
  {
    name: "find_component",
    description:
      "Find Viglet Design System components for a job, e.g. 'frosted container with no heading' or 'confirm a delete'. Returns ranked names, imports and one-line purposes.",
    inputSchema: {
      type: "object",
      properties: {
        job: { type: "string", description: "What the component should do, in plain words." },
        limit: { type: "integer", minimum: 1, maximum: 10, description: "How many to return (default 5)." },
      },
      required: ["job"],
    },
  },
  {
    name: "read_component",
    description:
      "Read one component: what it is for, its props, the contract rules that govern it, and an import to start from.",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "The exported name, e.g. BentoPanel." } },
      required: ["name"],
    },
  },
]

export const RESOURCES = [
  {
    uri: "viglet-ds://authoring",
    name: "authoring",
    title: "Authoring a bento page",
    description: "The page contract: the shell and who owns each region, page shapes, colour, i18n, accessibility.",
    mimeType: "text/markdown",
    file: "docs/BENTO-AUTHORING.md",
  },
  {
    uri: "viglet-ds://boundary",
    name: "boundary",
    title: "What the bento layer holds",
    description: "Which components are the shared layer and which stay in a product, and why.",
    mimeType: "text/markdown",
    file: "docs/BENTO-BOUNDARY.md",
  },
  {
    uri: "viglet-ds://tokens",
    name: "tokens",
    title: "Design tokens",
    description: "Every --vg-* custom property the preset declares, on the light and the dark ground.",
    mimeType: "text/markdown",
    file: "dist/preset.css",
  },
]

// ---------------------------------------------------------------------------
// The answers.

const STOP = new Set(["a", "an", "the", "to", "of", "for", "with", "and", "or", "in", "on", "that", "which", "is", "it", "my", "i", "want", "need", "component"])

/** `BentoPanel` -> ["bento", "panel"], `aria-label` -> ["aria", "label"]. */
const words = (text) =>
  (text ?? "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))

/** A crude stem, so "deleting" and "delete" meet at "delet". */
const stem = (word) => (word.length > 4 ? word.replace(/(ing|ion|ed|es|s|e)$/, "") : word)

/** A word counts when it starts a word of the text, so "confirm" finds "confirmation". */
function hits(query, text) {
  const haystack = words(text).map(stem)
  return query.filter((q) => haystack.some((w) => w.startsWith(q))).length
}

export function findComponents(catalogue, job, limit = FIND_LIMIT) {
  const query = [...new Set(words(job).map(stem))]
  if (query.length === 0) return []
  return catalogue.components
    .map((component) => ({
      component,
      score:
        hits(query, component.name) * 5 +
        hits(query, component.summary) * 3 +
        hits(query, component.description) +
        hits(query, component.props.map((p) => p.name).join(" ")) +
        hits(query, component.rules.join(" ")) -
        (component.deprecated ? 4 : 0),
    }))
    .filter((ranked) => ranked.score > 0)
    .sort((a, b) => b.score - a.score || a.component.name.localeCompare(b.component.name))
    .slice(0, Math.max(1, Math.min(10, limit)))
    .map(({ component }) => component)
}

export function renderFound(found, job) {
  if (found.length === 0) {
    return `No component matches "${job}". Try other words for the job, or read viglet-ds://boundary for what the layer holds.`
  }
  return found
    .map((c) => {
      const purpose = c.summary || "(no description in its declaration)"
      const deprecated = c.deprecated ? ` DEPRECATED: ${c.deprecated}` : ""
      return `${c.name} (${c.specifier}): ${purpose}${deprecated}`
    })
    .join("\n")
}

/** An import and the smallest element that type-checks: the required props, as placeholders. */
function starter(component) {
  if (component.example && component.example !== "yes") return component.example
  const required = component.props.filter((p) => !p.optional && p.name !== "children")
  const attributes = required.map((p) => ` ${p.name}={…}`).join("")
  return `import { ${component.name} } from "${component.specifier}"\n\n<${component.name}${attributes} />`
}

export function renderComponent(component) {
  const lines = [`# ${component.name}`, `import from ${component.specifier}`, ""]
  if (component.deprecated) lines.push(`DEPRECATED: ${component.deprecated}`, "")
  lines.push(component.description || "No description in its declaration.", "")

  lines.push("## Props")
  if (component.props.length === 0) lines.push("none of its own")
  for (const p of component.props) {
    lines.push(`- ${p.name}${p.optional ? "?" : ""}: ${p.type}${p.summary ? ` — ${p.summary}` : ""}`)
  }
  if (component.inheritedProps > 0) {
    lines.push(`- and ${component.inheritedProps} attributes of the element it renders, passed through`)
  }

  lines.push("", "## Governed by")
  lines.push(...(component.rules.length > 0 ? component.rules.map((r) => `- ${r}`) : ["no section of the contract names it"]))

  lines.push("", "## Start from", "```tsx", starter(component), "```")
  return lines.join("\n")
}

/** The preset's tokens, by ground, as `--name: value` lines. */
export function renderTokens(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "")
  const block = (selector) => {
    const at = text.search(selector)
    if (at === -1) return []
    const open = text.indexOf("{", at)
    const close = text.indexOf("\n}", open)
    return [...text.slice(open + 1, close).matchAll(/(--vg-[\w-]+)\s*:\s*([^;]+);/g)].map(
      ([, name, value]) => `${name}: ${value.replace(/\s+/g, " ").trim()}`,
    )
  }
  return [
    "# Design tokens",
    "",
    "Claim a token at `:root` in the product's stylesheet. `--primary` is claimed through the `--vg-primary-*-base` inputs, never by setting `--vg-primary` (see viglet-ds://authoring).",
    "",
    "## Light ground (:root)",
    ...block(/^:root\s*\{/m),
    "",
    "## Dark ground (.dark)",
    ...block(/^\.dark,?/m),
  ].join("\n")
}

// ---------------------------------------------------------------------------
// The server.

function loadCatalogue() {
  if (!existsSync(cataloguePath)) return null
  return JSON.parse(readFileSync(cataloguePath, "utf8"))
}

function textResult(text, isError = false) {
  return { content: [{ type: "text", text }], ...(isError ? { isError: true } : {}) }
}

export function handle(message, catalogue) {
  const { method, params = {} } = message
  switch (method) {
    case "initialize":
      return {
        protocolVersion: params.protocolVersion ?? PROTOCOL,
        capabilities: { tools: { listChanged: false }, resources: { listChanged: false } },
        serverInfo: { name: "viglet-ds", version: catalogue?.version ?? "unknown" },
      }
    case "ping":
      return {}
    case "tools/list":
      return { tools: TOOLS }
    case "resources/list":
      return { resources: RESOURCES.map(({ file: _file, ...resource }) => resource) }
    case "resources/read": {
      const resource = RESOURCES.find((r) => r.uri === params.uri)
      if (!resource) throw rpcError(-32602, `no resource ${params.uri}`)
      const path = join(packageRoot, resource.file)
      if (!existsSync(path)) throw rpcError(-32002, `${resource.file} is not in this copy of the package`)
      const raw = readFileSync(path, "utf8")
      const text = resource.name === "tokens" ? renderTokens(raw) : raw
      return { contents: [{ uri: resource.uri, mimeType: resource.mimeType, text }] }
    }
    case "tools/call": {
      if (!catalogue) {
        return textResult(`No catalogue at ${cataloguePath}: this release of the package does not ship one.`, true)
      }
      const input = params.arguments ?? {}
      if (params.name === "find_component") {
        if (typeof input.job !== "string" || !input.job.trim()) return textResult("find_component needs a job.", true)
        return textResult(renderFound(findComponents(catalogue, input.job, input.limit), input.job))
      }
      if (params.name === "read_component") {
        const wanted = String(input.name ?? "").trim()
        const component =
          catalogue.components.find((c) => c.name === wanted) ??
          catalogue.components.find((c) => c.name.toLowerCase() === wanted.toLowerCase())
        if (!component) {
          const near = findComponents(catalogue, wanted, 3).map((c) => c.name)
          return textResult(`No component named "${wanted}".${near.length ? ` Did you mean ${near.join(", ")}?` : ""}`, true)
        }
        return textResult(renderComponent(component))
      }
      throw rpcError(-32602, `no tool ${params.name}`)
    }
    default:
      throw rpcError(-32601, `method not found: ${method}`)
  }
}

function rpcError(code, message) {
  return Object.assign(new Error(message), { rpc: { code, message } })
}

function serve() {
  const catalogue = loadCatalogue()
  const reply = (payload) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...payload })}\n`)

  createInterface({ input: process.stdin }).on("line", (line) => {
    if (!line.trim()) return
    let message
    try {
      // A client on Windows can open the stream with a byte-order mark.
      message = JSON.parse(line.startsWith("\uFEFF") ? line.slice(1) : line)
    } catch {
      reply({ id: null, error: { code: -32700, message: "parse error" } })
      return
    }
    // A notification has no id and wants no answer.
    if (message.id === undefined || message.id === null) return
    try {
      reply({ id: message.id, result: handle(message, catalogue) })
    } catch (error) {
      reply({ id: message.id, error: error.rpc ?? { code: -32603, message: String(error.message ?? error) } })
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  serve()
}
