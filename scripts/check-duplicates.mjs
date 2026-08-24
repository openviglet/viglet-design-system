#!/usr/bin/env node
// VDS5 — fail a consumer's build when it declares a component this package
// already exports, and name the import that replaces it.
//
// Run it from a product checkout, in that product's CI:
//
//   viglet-ds-check-duplicates              # scan ./src
//   viglet-ds-check-duplicates src app      # scan these directories
//   viglet-ds-check-duplicates --json       # machine-readable findings
//   viglet-ds-check-duplicates --warn       # report, but exit 0
//   viglet-ds-check-duplicates --manifest p # read the export list from p
//
// Reporting that a duplicate exists is not the useful half. A local copy is
// written because the author did not know the shared one existed, so the finding
// has to end in the line they would have written instead — which is why the
// manifest records the specifier per entry point rather than just a list of
// names.
//
// A one-line re-export shim is the sanctioned pattern and is not a duplicate.
// VDS74 — the exemption is a name's, not a file's: `declaredNames` already
// ignores an `export { … } from` clause, so a shim reports nothing without a
// skip, while a name the file *declares* is reported whatever else that file
// also re-exports. Skipping the file instead let any real copy sitting beside a
// stray re-export through, which is the case this gate exists to catch.
//
// Some collisions are deliberate — Shio's AppFooter renders Shio's own build
// version and merely shares a name. Keep those by writing, anywhere in the file:
//
//   // viglet-ds-allow-duplicate AppFooter -- renders Shio's build version
//
// The reason is the point. A gate with no way to say "this one is mine" is a
// gate somebody deletes.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PACKAGE_NAME = "@viglet/viglet-design-system"
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"])
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "coverage", ".next"])

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const warnOnly = args.includes("--warn")
const manifestFlag = args.indexOf("--manifest")
const manifestPath = manifestFlag === -1 ? null : args[manifestFlag + 1]
const roots = args.filter(
  (a, i) => !a.startsWith("--") && i !== manifestFlag + 1,
)

function loadManifest() {
  // An explicit path wins: it is how this repository's own tests pin a fixture,
  // and how a monorepo checks against a version other than the hoisted one.
  if (manifestPath) {
    if (!existsSync(manifestPath)) {
      console.error(`check-duplicates: no manifest at ${manifestPath}`)
      process.exit(1)
    }
    return JSON.parse(readFileSync(manifestPath, "utf8"))
  }
  // Installed in the consumer.
  const require = createRequire(join(process.cwd(), "package.json"))
  try {
    return require(`${PACKAGE_NAME}/exports.json`)
  } catch {
    /* fall through */
  }
  // Running from this repository against its own dist.
  const local = resolve(dirname(fileURLToPath(import.meta.url)), "..", "dist", "exports.json")
  if (existsSync(local)) return JSON.parse(readFileSync(local, "utf8"))
  return null
}

const manifest = loadManifest()
if (!manifest) {
  console.error(
    `check-duplicates: could not read ${PACKAGE_NAME}/exports.json.\n` +
      `Install ${PACKAGE_NAME} (>= the version that ships the manifest) and re-run.`,
  )
  process.exit(1)
}

// name -> the specifier that exports it. The root entry wins when a name appears
// in more than one, since that is the import a product would write.
const exported = new Map()
for (const [subpath, entry] of Object.entries(manifest.entries)) {
  for (const name of [...entry.values, ...entry.types]) {
    const isType = entry.types.includes(name)
    if (!exported.has(name) || subpath === ".") {
      exported.set(name, { specifier: entry.specifier, isType })
    }
  }
}

function collect(dir, files = []) {
  let dirents
  try {
    dirents = readdirSync(dir, { withFileTypes: true })
  } catch {
    return files
  }
  for (const entry of dirents) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) collect(full, files)
    } else if (EXTENSIONS.has(entry.name.slice(entry.name.lastIndexOf(".")))) {
      files.push(full)
    }
  }
  return files
}

// `export const X`, `export function X`, `export class X`, `export type X`,
// `export interface X`, and the names inside a local `export { A, B as C }`.
const DECLARED =
  /^\s*export\s+(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:const|let|var|function\*?|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/gm
const EXPORT_LIST = /^\s*export\s+(?:type\s+)?\{([^}]*)\}\s*(?!from)[;\n]/gm

function declaredNames(source) {
  const names = new Map()
  for (const match of source.matchAll(DECLARED)) {
    names.set(match[1], lineOf(source, match.index))
  }
  for (const match of source.matchAll(EXPORT_LIST)) {
    for (const clause of match[1].split(",")) {
      // `A as B` exports B; a bare `A` exports A.
      const name = clause.includes(" as ")
        ? clause.split(" as ").pop().trim()
        : clause.trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name) && name !== "default") {
        names.set(name, lineOf(source, match.index))
      }
    }
  }
  return names
}

function lineOf(source, index) {
  return source.slice(0, index).split("\n").length
}

const scanRoots = (roots.length ? roots : ["src"]).map((r) => resolve(r))
const missing = scanRoots.filter((r) => !existsSync(r) || !statSync(r).isDirectory())
if (missing.length === scanRoots.length) {
  console.error(
    `check-duplicates: nothing to scan (${scanRoots.map((r) => relative(process.cwd(), r)).join(", ")}).\n` +
      "Pass the source directories explicitly: viglet-ds-check-duplicates <dir> [dir]",
  )
  process.exit(1)
}

const findings = []
let scanned = 0
for (const root of scanRoots) {
  for (const file of collect(root)) {
    const source = readFileSync(file, "utf8")
    scanned++
    const allowed = new Set(
      [...source.matchAll(/viglet-ds-allow-duplicate\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]),
    )
    for (const [name, line] of declaredNames(source)) {
      const match = exported.get(name)
      if (!match || allowed.has(name)) continue
      findings.push({
        file: relative(process.cwd(), file).replace(/\\/g, "/"),
        line,
        name,
        replacement: match.isType
          ? `import type { ${name} } from "${match.specifier}"`
          : `import { ${name} } from "${match.specifier}"`,
      })
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ scanned, findings }, null, 2))
} else if (findings.length === 0) {
  console.log(
    `check-duplicates: ${scanned} file(s) scanned, no local copy of a ${PACKAGE_NAME} export.`,
  )
} else {
  console.error(
    `\ncheck-duplicates: ${findings.length} declaration(s) already exported by ${PACKAGE_NAME}@${manifest.version}\n`,
  )
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}  declares ${finding.name}`)
    console.error(`      replace it with:  ${finding.replacement}\n`)
  }
  console.error(
    "A local copy that drifts is the failure the design system exists to prevent.\n" +
      "If the product genuinely needs a variation, wrap the shared component rather\n" +
      "than re-declaring its name.\n",
  )
}

process.exit(findings.length > 0 && !warnOnly ? 1 : 0)
