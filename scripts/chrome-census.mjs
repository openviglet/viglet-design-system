#!/usr/bin/env node
// VDS144 — which consumers still render console-era chrome, measured.
//
//   pnpm chrome:census            # every consumer checked out on this machine
//   pnpm chrome:census --json     # the measurement, for a script
//
// Two non-goals wait on "every console cuts over": keep the console-era exports,
// and keep more than one chrome. That condition was the `chrome` field in
// consumers.json, typed by hand, so nobody could tell when it came true: the
// register called a product `console` after it had moved, and `bento` while it
// still imported console-era components through its own shims.
//
// So the field is measured. For each consumer checked out here, its declared
// `sourceRoots` are read and every file taking a console-era name (the swap table
// in scripts/lib/console-era.mjs) is counted, whether it imports the name from
// the package or from a one-line shim that re-exports it. Then:
//
//   console-era files > 0   chrome must be `console`, or `mixed` for a consumer
//                           that also takes ./bento
//   console-era files = 0   chrome must be neither
//
// The cutover the non-goals wait for is then a reading: no consumer declared
// `console` or `mixed`, with this census green.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { resolveCheckouts } from "./lib/checkouts.mjs"
import { CONSOLE_ERA } from "./lib/console-era.mjs"

const PACKAGE_NAME = "@viglet/viglet-design-system"
const ERA = new Set(Object.keys(CONSOLE_ERA))
const SOURCE = /\.(tsx?|jsx?|mts|mjs|cts|cjs)$/
const NOT_PRODUCT = /\.(test|spec|stories)\.[^.]+$/
const SKIP = new Set(["node_modules", "dist", "build", "out", "coverage", "test", "tests", "__tests__"])

function sources(path, found = []) {
  if (!existsSync(path)) return found
  if (statSync(path).isFile()) {
    if (SOURCE.test(path)) found.push(path)
    return found
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name) && !entry.name.startsWith(".")) sources(full, found)
    } else if (SOURCE.test(entry.name) && !NOT_PRODUCT.test(entry.name)) {
      found.push(full)
    }
  }
  return found
}

/** The names inside every `{ … }` import or re-export clause in a file, with where each comes from. */
function clauses(text) {
  const out = []
  for (const match of text.matchAll(/\b(import|export)\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g)) {
    for (const part of match[2].split(",")) {
      const [name, alias] = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/).map((s) => s.trim())
      if (name) out.push({ kind: match[1], name, alias: alias ?? name, from: match[3] })
    }
  }
  return out
}

/**
 * One consumer's console-era use: for each name, how many of its source files
 * take it. A name counts from the package, or from a shim, when any file in the
 * consumer re-exports that name from the package.
 */
export function measureConsumer(checkout, sourceRoots) {
  const texts = sourceRoots.flatMap((root) => sources(join(checkout, root))).map((file) => readFileSync(file, "utf8"))
  const fromPackage = (from) => from === PACKAGE_NAME || from.startsWith(`${PACKAGE_NAME}/`)

  const reachable = new Set()
  for (const text of texts) {
    for (const clause of clauses(text)) {
      if (fromPackage(clause.from) && ERA.has(clause.name)) reachable.add(clause.alias)
    }
  }

  const files = {}
  for (const text of texts) {
    const taken = new Set(
      clauses(text)
        .filter((c) => c.kind === "import" && reachable.has(c.name))
        .map((c) => c.name),
    )
    for (const name of taken) files[name] = (files[name] ?? 0) + 1
  }
  const total = Object.values(files).reduce((sum, n) => sum + n, 0)
  return { scanned: texts.length, files, total }
}

/** What a consumer's measured use says its chrome must be, or null where the declaration holds. */
export function chromeFinding(consumer, measured) {
  const declared = consumer.chrome
  const takesBento = (consumer.entries ?? []).includes("./bento")
  if (measured.total > 0) {
    const expected = takesBento ? "mixed" : "console"
    if (declared !== expected) {
      const names = Object.entries(measured.files)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => `${name} ${count}`)
        .join(", ")
      return `${consumer.id} is declared "${declared}" and ${measured.total} source file import(s) take console-era chrome (${names}); declare it "${expected}"`
    }
    return null
  }
  if (declared === "console" || declared === "mixed") {
    return `${consumer.id} is declared "${declared}" and no source file takes console-era chrome; declare the chrome it renders`
  }
  return null
}

export function census(register, repoRoot, line) {
  const { found, missing, offMachine } = resolveCheckouts(register, repoRoot, line)
  const rows = found.map(({ consumer, path }) => {
    const measured = measureConsumer(path, consumer.sourceRoots ?? [])
    return { id: consumer.id, chrome: consumer.chrome, ...measured, finding: chromeFinding(consumer, measured) }
  })
  return {
    rows,
    notMeasured: [...missing.map((m) => m.consumer.id), ...offMachine.map((o) => o.consumer.id)],
    consoles: register.consumers.filter((c) => c.chrome === "console" || c.chrome === "mixed").map((c) => c.id),
  }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const register = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8"))
  const line = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version.split(".").slice(0, 2).join(".")
  const result = census(register, root, line)
  const findings = result.rows.map((r) => r.finding).filter(Boolean)

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    for (const row of result.rows) {
      const names = Object.entries(row.files).map(([name, count]) => `${name} ${count}`).join(", ")
      console.log(`  ${row.id.padEnd(20)} ${row.chrome.padEnd(15)} ${String(row.total).padStart(4)} console-era file import(s)${names ? `  (${names})` : ""}`)
    }
    if (result.notMeasured.length > 0) console.log(`  not measured here: ${result.notMeasured.join(", ")}`)
    console.log(
      `\nchrome-census: ${result.consoles.length === 0 ? "no consumer renders console-era chrome" : `still on console-era chrome: ${result.consoles.join(", ")}`}`,
    )
    for (const finding of findings) console.error(`  - ${finding}`)
  }
  process.exit(findings.length > 0 ? 1 : 0)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
