#!/usr/bin/env node
// VDS5 — write dist/exports.json, the machine-readable list of what this package
// exports, so a consumer can be told that its local copy of a component already
// exists here.
//
// Nothing in this package declared its own surface in a form a script could
// read. The two consumers are honest today because their authors were
// disciplined, and discipline is not an instrument: the moment a product needs a
// small variation, the fastest path is a local copy, and nothing anywhere fails.
// This file is the input to `viglet-ds-check-duplicates`, which consumers run in
// their own CI.
//
// Read from the built declarations rather than the source, so what is recorded
// is what a consumer can actually import — `export *` expanded, type-only
// exports separated from values.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(repoRoot, "dist")
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))

// Subpath -> the declaration file that describes it, taken from the manifest so
// a new entry point is picked up without editing this script.
const entries = {}
const addEntry = (subpath, value) => {
  const types = typeof value === "string" ? null : value?.types
  if (typeof types === "string" && types.startsWith("./dist/")) {
    entries[subpath] = join(repoRoot, types.slice(2))
  }
}
for (const [subpath, value] of Object.entries(pkg.exports ?? {})) addEntry(subpath, value)

const program = ts.createProgram(Object.values(entries), {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  skipLibCheck: true,
  noEmit: true,
})
const checker = program.getTypeChecker()

// A symbol is a value export if any of its declarations can be used in an
// expression. Interfaces, type aliases and type-only re-exports are not.
const VALUE_FLAGS =
  ts.SymbolFlags.Variable |
  ts.SymbolFlags.Function |
  ts.SymbolFlags.Class |
  ts.SymbolFlags.Enum |
  ts.SymbolFlags.ValueModule |
  ts.SymbolFlags.Method |
  ts.SymbolFlags.Property

const manifest = {
  name: pkg.name,
  version: pkg.version,
  generatedBy: "scripts/emit-exports.mjs",
  entries: {},
}

let total = 0
for (const [subpath, declarationFile] of Object.entries(entries)) {
  const source = program.getSourceFile(declarationFile)
  if (!source) {
    console.error(`emit-exports: no declaration file for "${subpath}" at ${declarationFile}`)
    process.exit(1)
  }
  const moduleSymbol = checker.getSymbolAtLocation(source)
  if (!moduleSymbol) {
    console.error(`emit-exports: "${subpath}" (${declarationFile}) exports nothing readable.`)
    process.exit(1)
  }

  const values = []
  const types = []
  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const resolved =
      symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
    ;(resolved.flags & VALUE_FLAGS ? values : types).push(symbol.getName())
  }

  values.sort()
  types.sort()
  total += values.length + types.length
  manifest.entries[subpath] = {
    // The specifier a consumer writes to import from this entry.
    specifier: subpath === "." ? pkg.name : `${pkg.name}/${subpath.replace(/^\.\//, "")}`,
    values,
    types,
  }
}

const target = join(dist, "exports.json")
writeFileSync(target, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(
  `emit-exports: ${total} export(s) across ${Object.keys(manifest.entries).length} entry point(s) -> dist/exports.json`,
)
