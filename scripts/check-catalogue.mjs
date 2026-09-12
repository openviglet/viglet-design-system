#!/usr/bin/env node
// VDS136 — the catalogue covers the barrel, and the server stays inside its budget.
//
// Runs at the end of the build, after emit-catalogue, because both questions need
// the real dist: which names the entries export, and what the server answers
// about them.
//
//   1. Every PascalCase value an entry exports is in the catalogue, as a
//      component or set aside with the reason it is not one. A component the
//      classifier misses is one no agent can find, and it would be missed
//      silently: the catalogue has no other reader that knows the barrel.
//   2. The tool list, a find and the largest read stay under the ceilings in
//      token-budget.properties, and the tool list plus the skill stay smaller
//      than the contract documents they replace.

import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { handle } from "./mcp.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const CHARS_PER_TOKEN = 4
const tokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN)

/** Jobs an agent plausibly asks, each with the component that has to come first. */
export const SAMPLE_JOBS = [
  ["frosted container with no heading", "BentoPanel"],
  ["confirm before deleting", "DialogDelete"],
  ["page shell with a nav rail", "BentoShell"],
  ["list of entities as tiles", "BentoListPage"],
  ["save bar that appears on scroll", "BentoScrollSaveBar"],
  ["empty state", "BentoEmptyState"],
  ["language switcher", "LanguageSwitcher"],
]

/** Every `key=value`, comments dropped; a key the gate needs and cannot find is a failure. */
function budgets() {
  const out = {}
  for (const line of readFileSync(join(root, "token-budget.properties"), "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq > 0) out[trimmed.slice(0, eq).trim()] = Number(trimmed.slice(eq + 1).trim())
  }
  return out
}

function main() {
  const failures = []
  const cataloguePath = join(root, "dist", "catalogue.json")
  if (!existsSync(cataloguePath)) {
    console.error("check-catalogue: dist/catalogue.json is missing — run the build first")
    process.exit(1)
  }
  const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"))
  const exported = JSON.parse(readFileSync(join(root, "dist", "exports.json"), "utf8"))

  // 1. Coverage.
  const accounted = new Set([...catalogue.components, ...catalogue.excluded].map((c) => c.name))
  const pascal = new Set(
    Object.values(exported.entries)
      .flatMap((entry) => entry.values)
      .filter((name) => /^[A-Z][A-Za-z0-9]*$/.test(name) && !/^[A-Z0-9_]+$/.test(name)),
  )
  for (const name of [...pascal].sort()) {
    if (!accounted.has(name)) failures.push(`${name} is exported and in neither the catalogue nor its set-aside list`)
  }

  // 2. The budget.
  const declared = budgets()
  const need = (key) => {
    if (!Number.isFinite(declared[key])) failures.push(`token-budget.properties has no number for ${key}`)
    return declared[key]
  }
  const call = (name, args) => JSON.stringify(handle({ method: "tools/call", params: { name, arguments: args } }, catalogue))

  const measured = {
    toolsList: tokens(JSON.stringify(handle({ method: "tools/list" }, catalogue))),
    find: 0,
    read: 0,
    readName: "",
    skill: tokens(readFileSync(join(root, "claude-plugin", "skills", "viglet-ds-pages", "SKILL.md"), "utf8")),
    replaced: tokens(
      readFileSync(join(root, "docs", "BENTO-AUTHORING.md"), "utf8") + readFileSync(join(root, "docs", "BENTO-BOUNDARY.md"), "utf8"),
    ),
  }

  for (const [job, first] of SAMPLE_JOBS) {
    const answer = call("find_component", { job })
    measured.find = Math.max(measured.find, tokens(answer))
    const top = JSON.parse(answer).content[0].text.split(" (")[0]
    if (top !== first) failures.push(`find_component "${job}" ranks ${top} first, not ${first}`)
  }
  for (const component of catalogue.components) {
    const size = tokens(call("read_component", { name: component.name }))
    if (size > measured.read) {
      measured.read = size
      measured.readName = component.name
    }
  }

  const rows = [
    ["tools/list", measured.toolsList, need("mcp.toolsList.maxTokens")],
    ["find_component (largest sample)", measured.find, need("mcp.findComponent.maxTokens")],
    [`read_component (largest: ${measured.readName})`, measured.read, need("mcp.readComponent.maxTokens")],
    ["skill", measured.skill, need("skill.pointer.maxTokens")],
  ]
  for (const [what, size, ceiling] of rows) {
    if (size > ceiling) failures.push(`${what} is ${size} tokens, over its ceiling of ${ceiling}`)
  }

  const standing = measured.toolsList + measured.skill
  if (standing >= measured.replaced) {
    failures.push(
      `the tool list and the skill are ${standing} tokens, and the documents they replace are ${measured.replaced}: the server no longer earns its place`,
    )
  }

  if (failures.length > 0) {
    console.error(`\ncheck-catalogue: ${failures.length} problem(s)\n`)
    for (const failure of failures) console.error(`  - ${failure}`)
    console.error("")
    process.exit(1)
  }

  const described = catalogue.components.filter((c) => c.summary).length
  const lookups = Math.floor((measured.replaced - standing) / measured.read)
  console.log(
    `check-catalogue: ${catalogue.components.length} components (${described} described), ` +
      `${pascal.size} PascalCase exports accounted for; tools/list ${measured.toolsList}, ` +
      `find ${measured.find}, read ${measured.read}, skill ${measured.skill} tokens against ${measured.replaced} replaced ` +
      `(${lookups} worst-case lookups to break even) — clean.`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
