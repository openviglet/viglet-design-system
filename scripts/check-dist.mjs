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
//   4. Only the entries documented as needing react-router-dom may import it.
//      The manifest calls that peer optional, which is true of the root and
//      false of ./router and ./bento — npm cannot express a per-subpath peer,
//      so the split is documented, and this is what keeps the documentation
//      true. An entry that quietly grows a Link makes a consumer's build fail
//      on a dependency it was told it did not need.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { basename, dirname, join, relative, resolve } from "node:path"
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

// 4. Only ./router and ./bento may reach for the router.
const ROUTER_ENTRIES = new Set(["router", "bento"])
for (const file of files) {
  const match = /^(.+)[.](es|cjs)[.]js$/.exec(basename(file))
  if (!match) continue
  const entry = match[1]
  if (ROUTER_ENTRIES.has(entry)) continue
  if (/["']react-router-dom["']/.test(readFileSync(file, "utf8"))) {
    failures.push(
      `${relative(repoRoot, file)} imports react-router-dom, but only ` +
        `${[...ROUTER_ENTRIES].map((e) => `./${e}`).join(" and ")} are documented as ` +
        "needing it. A consumer told the peer was optional will fail to build.",
    )
  }
}

// ---------------------------------------------------------------------------
// VDS44 — a shipped stylesheet resolves nothing through the consumer's tree.
//
// `fonts.css` used to ship verbatim with `@import "@fontsource-variable/inter"`
// in it, resolved by whatever the consumer's bundler looked at. That worked
// only because all three products use pnpm's hoisted linker, and its failure is
// the silent kind: a missing `@import` is not an error, the type falls back to
// `system-ui`, and nobody sees it until a screenshot.
//
// So: no bare specifier in any shipped CSS, and every `url()` points at a file
// that is actually in the package.
for (const file of files.filter((f) => f.endsWith(".css"))) {
  const css = readFileSync(file, "utf8")
  const name = relative(repoRoot, file)

  // Only a real rule — the doc comments in preset.css quote `@import` lines as
  // usage examples, and quoting one is not shipping one.
  const withoutComments = css.replaceAll(/\/\*[\s\S]*?\*\//g, "")
  for (const [, specifier] of withoutComments.matchAll(/@import\s+["']([^"']+)["']/g)) {
    if (specifier.startsWith(".") || specifier.startsWith("/")) continue
    failures.push(
      `${name} imports "${specifier}" by bare specifier, which resolves in the ` +
        "consumer's tree rather than here. It works under a hoisting linker and " +
        "silently does nothing under another.",
    )
  }

  for (const [, url] of css.matchAll(/url\(\s*["']?(\.[^"')]+)["']?\s*\)/g)) {
    if (!existsSync(resolve(dirname(file), url))) {
      failures.push(`${name} references ${url}, which is not in dist/`)
    }
  }
}

// ---------------------------------------------------------------------------
// VDS71 — every entry is on one side of the React Server Components boundary,
// and the build says which.
//
// Under RSC a module without `"use client"` *is* a server module, so an entry
// that reaches a hook and lacks the directive fails a consumer's build on the
// first one — which is what two Next consumers were each working around in
// their own repository. The reverse costs too: a directive on `./vite`, a
// build-time plugin that runs in Node, or on `./assets`, which is logo data,
// takes away a server component's ability to import them for no gain.
//
// The list lives in vite.config.ts, which is what writes the banner. This
// asserts the emitted files agree with it, in both formats, because a config
// that stops taking effect is silent: the build still succeeds and the
// directive is simply gone.
const CLIENT_ENTRIES = new Set(["index", "bento", "router", "floating-formulas-bg", "i18n"])
const SERVER_ENTRIES = new Set(["assets", "vite"])
const DIRECTIVE = /^\s*["']use client["']/

for (const entry of [...CLIENT_ENTRIES, ...SERVER_ENTRIES]) {
  for (const file of [`${entry}.es.js`, `${entry}.cjs`]) {
    const path = join(dist, file)
    if (!existsSync(path)) {
      failures.push(`${file} is missing, so its client boundary cannot be checked`)
      continue
    }
    const has = DIRECTIVE.test(readFileSync(path, "utf8"))
    if (CLIENT_ENTRIES.has(entry) && !has) {
      failures.push(
        `${file} carries no "use client" directive. It reaches React state, ` +
          "context or a browser API, so a server component importing it fails " +
          "the consumer's build on the first hook.",
      )
    }
    if (SERVER_ENTRIES.has(entry) && has) {
      failures.push(
        `${file} carries a "use client" directive and should not. It is ` +
          "server-renderable, and marking it takes that away from a consumer.",
      )
    }
  }
}

if (failures.length > 0) {
  console.error(`\ncheck-dist: ${failures.length} problem(s) in dist/\n`)
  for (const failure of failures) console.error(`  - ${failure}`)
  console.error("")
  process.exit(1)
}

console.log(`check-dist: ${files.length} files, ${promised.size} export paths — clean.`)
