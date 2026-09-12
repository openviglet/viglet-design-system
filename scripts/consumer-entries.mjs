#!/usr/bin/env node
// VDS129 — measure which entries a consumer imports and hold that against what
// consumers.json declares for it, in both directions.
//
// Run it from a product checkout, in that product's own test or CI step:
//
//   viglet-ds-consumer-entries                    # match this package.json's name
//   viglet-ds-consumer-entries --consumer shio    # name the register entry
//   viglet-ds-consumer-entries --root <dir>       # measure a checkout elsewhere
//   viglet-ds-consumer-entries --json             # machine-readable result
//   viglet-ds-consumer-entries --register <path>  # read a register other than the installed one
//
// The register used to be checked in one direction only: every entry it declared
// had to be a real subpath. Nothing asked the converse, so Shio's entry listed
// three of the six subpaths its source takes and kept a chrome it had left two
// blocks earlier, and every guard reading the register read that. Nothing could
// ask from the product's side either, because the register was not published.
//
// Where to look is declared, not guessed: each consumer names its `sourceRoots`,
// directories or single files relative to its package root. A test or a story
// inside them is not the product taking a subpath — a census test that greps for
// `./bento` would otherwise record the product importing what it only counts —
// so those files are skipped, and so is anything inside a comment.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, isAbsolute, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PACKAGE_NAME = "@viglet/viglet-design-system"
const EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mdx",
  ".css",
  ".scss",
])
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  "storybook-static",
  "__tests__",
  "test",
  "tests",
])
const NOT_PRODUCT = /\.(test|spec|stories)\.[^.]+$/

const args = process.argv.slice(2)
const asJson = args.includes("--json")

/** The value after `--flag`, or null when the flag is absent. */
function option(flag) {
  const at = args.indexOf(flag)
  return at === -1 ? null : (args[at + 1] ?? null)
}

function fail(message) {
  console.error(`consumer-entries: ${message}`)
  process.exit(1)
}

const root = resolve(option("--root") ?? process.cwd())
const registerPath = resolve(
  option("--register") ?? join(dirname(fileURLToPath(import.meta.url)), "..", "consumers.json"),
)

if (!existsSync(registerPath)) fail(`no register at ${registerPath}`)
const register = JSON.parse(readFileSync(registerPath, "utf8"))

function findConsumer() {
  const named = option("--consumer")
  if (named) {
    const byId = register.consumers.find((c) => c.id === named)
    if (!byId) {
      fail(`no consumer "${named}" in ${registerPath}; it declares ${register.consumers.map((c) => c.id).join(", ")}`)
    }
    return byId
  }
  const manifest = join(root, "package.json")
  if (!existsSync(manifest)) fail(`no package.json in ${root}; pass --consumer <id>`)
  const name = JSON.parse(readFileSync(manifest, "utf8")).name
  const byPackage = register.consumers.find((c) => c.package === name)
  if (!byPackage) {
    fail(
      `${name} is not a consumer in ${registerPath}. Declare it there, or pass --consumer <id> ` +
        `(one of ${register.consumers.map((c) => c.id).join(", ")})`,
    )
  }
  return byPackage
}

const consumer = findConsumer()
const sourceRoots = consumer.sourceRoots ?? []
if (sourceRoots.length === 0) {
  fail(`${consumer.id} declares no sourceRoots, so there is nothing to measure its entries against`)
}

function collect(path, files = []) {
  const stat = statSync(path)
  if (stat.isFile()) {
    files.push(path)
    return files
  }
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) collect(full, files)
    } else if (EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf("."))) && !NOT_PRODUCT.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

const missing = sourceRoots.filter((r) => isAbsolute(r) || !existsSync(join(root, r)))
if (missing.length > 0) {
  fail(`${consumer.id} declares sourceRoots that are not under ${root}: ${missing.join(", ")}`)
}

// Blanked rather than removed, so an import's line number survives the strip.
// Only a comment that opens its line: a glob such as "src/**" in a config file
// opens a block anywhere else and would swallow the imports after it.
const blank = (text) => text.replace(/[^\n]/g, " ")
const withoutComments = (source) =>
  source.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, blank).replace(/^[ \t]*\/\/.*$/gm, blank)

// `from "x"`, `import "x"`, `import("x")`, `require("x")` and CSS `@import "x"` or
// `@import url("x")`. The specifier is the package name alone or a subpath of it.
const SPECIFIER = new RegExp(
  String.raw`(?:\bfrom|\bimport|\brequire|@import)\s*(?:\(\s*|url\(\s*)?["'](${PACKAGE_NAME}(?:/[^"'\s]*)?)["']`,
  "g",
)

/** `@viglet/viglet-design-system/bento` -> `./bento`; the bare name -> `.`. */
const entryOf = (specifier) =>
  specifier === PACKAGE_NAME ? "." : `.${specifier.slice(PACKAGE_NAME.length)}`

const imported = new Map()
let scanned = 0
for (const sourceRoot of sourceRoots) {
  for (const file of collect(join(root, sourceRoot))) {
    scanned++
    const source = withoutComments(readFileSync(file, "utf8"))
    for (const match of source.matchAll(SPECIFIER)) {
      const entry = entryOf(match[1])
      if (imported.has(entry)) continue
      imported.set(entry, {
        file: relative(root, file).replaceAll("\\", "/"),
        line: source.slice(0, match.index).split("\n").length,
      })
    }
  }
}

if (scanned === 0) {
  fail(`${consumer.id}'s sourceRoots (${sourceRoots.join(", ")}) hold no source file, so this would pass vacuously`)
}

const declared = new Set(consumer.entries)
const undeclared = [...imported.entries()]
  .filter(([entry]) => !declared.has(entry))
  .map(([entry, at]) => ({ entry, ...at }))
  .sort((a, b) => a.entry.localeCompare(b.entry))
const unused = [...declared].filter((entry) => !imported.has(entry)).sort()

if (asJson) {
  console.log(
    JSON.stringify(
      {
        consumer: consumer.id,
        scanned,
        declared: [...declared].sort(),
        imported: [...imported.keys()].sort(),
        undeclared,
        unused,
      },
      null,
      2,
    ),
  )
} else if (undeclared.length === 0 && unused.length === 0) {
  console.log(
    `consumer-entries: ${consumer.id} imports the ${declared.size} entries consumers.json declares for it (${scanned} file(s) scanned).`,
  )
} else {
  console.error(`\nconsumer-entries: ${consumer.id}'s source and its entry in consumers.json disagree\n`)
  if (undeclared.length > 0) {
    console.error("  imported, and not declared:")
    for (const { entry, file, line } of undeclared) console.error(`    ${entry}  first at ${file}:${line}`)
  }
  if (unused.length > 0) {
    console.error("  declared, and imported nowhere:")
    for (const entry of unused) console.error(`    ${entry}`)
  }
  console.error(
    `\nThe register is what this package's guards read, so a consumer it misdescribes is\n` +
      `checked against a product that does not exist. Correct the entry in consumers.json.\n`,
  )
}

process.exit(undeclared.length > 0 || unused.length > 0 ? 1 : 0)
