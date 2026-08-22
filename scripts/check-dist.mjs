#!/usr/bin/env node
// Assert that dist/ is publishable, and fail the build when it is not.
//
// Every check here exists because the thing it catches shipped, or nearly did,
// and none of them are visible from inside this repository: the package builds,
// type-checks and tests green while dist is broken for everyone installing it.
//
//   1. No declaration may import through a node_modules path. Under pnpm's
//      symlinked layout TypeScript resolves each dependency to its real
//      .pnpm/<name>@<version> directory and writes that into the emitted .d.ts.
//      The path exists in no consumer, so React's types silently vanish and the
//      product build fills with implicit-any and "not a valid JSX component".
//   2. No test or story artefact may be in dist. They are type-checked here and
//      are not part of the published surface.
//   3. Every path named in package.json "exports" must exist. A rename that
//      misses the manifest is only found by a consumer's import failing.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(repoRoot, "dist")
const failures = []

if (!existsSync(dist)) {
  console.error("check-dist: no dist/ — run the build first.")
  process.exit(1)
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else files.push(full)
  }
  return files
}

const files = walk(dist)

// 1. Declarations must import by package name, never through node_modules.
const SPECIFIER = /(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g
for (const file of files) {
  if (!file.endsWith(".d.ts")) continue
  const source = readFileSync(file, "utf8")
  for (const [, specifier] of source.matchAll(SPECIFIER)) {
    if (specifier.includes("node_modules")) {
      failures.push(
        `${relative(repoRoot, file)} imports through node_modules: "${specifier}"\n` +
          "    pnpm's symlinked layout leaked into the emit — see nodeLinker in pnpm-workspace.yaml.",
      )
    }
  }
}

// 2. Nothing authored for the harness belongs in the published tree.
for (const file of files) {
  if (/\.(test|spec|stories)\./.test(file) || /[\\/]test[\\/]/.test(file)) {
    failures.push(`${relative(repoRoot, file)} is a test or story artefact and must not ship.`)
  }
}

// 3. Everything the manifest promises has to be on disk.
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
const promised = new Set()
const collect = (value) => {
  if (typeof value === "string") {
    if (value.startsWith("./dist/")) promised.add(value.slice(2))
  } else if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collect(nested)
  }
}
collect(pkg.exports)
for (const field of ["main", "module", "types"]) collect(pkg[field])

for (const promise of promised) {
  const target = join(repoRoot, promise)
  if (!existsSync(target) || !statSync(target).isFile()) {
    failures.push(`package.json promises ./${promise}, which the build did not produce.`)
  }
}

if (failures.length > 0) {
  console.error(`\ncheck-dist: ${failures.length} problem(s) in dist/\n`)
  for (const failure of failures) console.error(`  - ${failure}`)
  console.error("")
  process.exit(1)
}

console.log(`check-dist: ${files.length} files, ${promised.size} export paths — clean.`)
