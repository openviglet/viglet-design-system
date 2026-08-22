#!/usr/bin/env node
// Build this checkout and push it into every local product that depends on it.
//
// This replaces the two copy-ds.cmd scripts, which each hardcoded a version
// directory (shio/shio-react, turing/2026.1/frontend) and so pointed at nothing
// after the checkouts moved to 2026.3. Two things are resolved rather than
// assumed: which checkouts consume this package, read from their package.json,
// and where each one keeps the installed copy, read by following the link its
// own package manager created. The products are pnpm workspaces today and npm
// yesterday; neither is named here.
//
//   pnpm use:local              # discover consumers, build, push
//   pnpm use:local --list       # show what would be written to
//   pnpm use:local <dir> [dir]  # push to these consumers only
//   pnpm use:local --no-build   # reuse the dist already on disk
//   pnpm use:local --all        # include checkouts off the current line
//
// dist and package.json are copied over the installed copy in place. Nothing is
// linked: a link makes the product resolve this checkout's node_modules too,
// which loads a second React and breaks hooks in ways that look like product
// bugs. Nothing in the product's manifest or lockfile is touched either, so
// `pnpm install` in the product puts the published build back.

import { spawnSync } from "node:child_process"
import { cpSync, existsSync, readdirSync, readFileSync, realpathSync, rmSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const PACKAGE_NAME = "@viglet/viglet-design-system"
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

// How deep a product checkout nests its frontend: shio-react sits three levels
// under the products root, turing-app five.
const MAX_DEPTH = 6
const SKIP = new Set([
  "node_modules",
  ".git",
  "dist",
  "target",
  "storybook-static",
  "build",
  // Kept on disk to read, never to build against.
  "archived",
])

// "2026.3.2" -> "2026.3". Products keep one checkout per line, and a change to
// this package belongs against the line it is cut from — not against 2026.2.
const currentLine = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
  .version.split(".")
  .slice(0, 2)
  .join(".")

const args = process.argv.slice(2)
const listOnly = args.includes("--list")
const skipBuild = args.includes("--no-build")
const includeAll = args.includes("--all")
const explicit = args.filter((a) => !a.startsWith("--"))

function dependsOnUs(packageJsonPath) {
  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"))
    if (pkg.name === PACKAGE_NAME) return false
    return Boolean(
      pkg.dependencies?.[PACKAGE_NAME] ??
        pkg.devDependencies?.[PACKAGE_NAME] ??
        pkg.peerDependencies?.[PACKAGE_NAME],
    )
  } catch {
    return false
  }
}

function discover(root, depth = 0, found = []) {
  if (depth > MAX_DEPTH) return found
  let entries
  try {
    entries = readdirSync(root, { withFileTypes: true })
  } catch {
    return found
  }
  if (
    entries.some((e) => e.isFile() && e.name === "package.json") &&
    dependsOnUs(join(root, "package.json"))
  ) {
    found.push(root)
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP.has(entry.name) || entry.name.startsWith(".")) continue
    discover(join(root, entry.name), depth + 1, found)
  }
  return found
}

// Where this consumer actually keeps the package: its own node_modules, or a
// workspace root above it. Follow the link, so a pnpm store path resolves to the
// one directory every workspace member shares.
function installedPathFor(consumer) {
  let dir = consumer
  for (;;) {
    const candidate = join(dir, "node_modules", ...PACKAGE_NAME.split("/"))
    if (existsSync(candidate)) return realpathSync(candidate)
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

const productsRoot = resolve(repoRoot, "..")
let consumers
if (explicit.length) {
  consumers = explicit.map((p) => resolve(p))
} else {
  const discovered = discover(productsRoot)
  const onLine = discovered.filter((p) => p.split(/[\\/]/).includes(currentLine))
  consumers = includeAll ? discovered : onLine
  const skipped = discovered.length - consumers.length
  if (skipped > 0) {
    console.log(`Ignoring ${skipped} checkout(s) off the ${currentLine} line (--all includes them).\n`)
  }
}

if (consumers.length === 0) {
  console.error(
    `No ${currentLine} checkout depending on ${PACKAGE_NAME} was found under ${productsRoot}.\n` +
      "Pass the consumer directories explicitly: node scripts/use-local.mjs <dir> [dir]",
  )
  process.exit(1)
}

const targets = []
for (const consumer of consumers) {
  const installed = installedPathFor(consumer)
  if (!installed) {
    console.error(
      `  ${consumer}\n    SKIPPED — ${PACKAGE_NAME} is not installed here. Install the product's ` +
        "dependencies first, then re-run.",
    )
    continue
  }
  targets.push({ consumer, installed })
  console.log(`  ${consumer}\n    -> ${installed}`)
}

if (targets.length === 0) process.exit(1)
if (listOnly) process.exit(0)

if (!skipBuild) {
  console.log("\nBuilding the design system...")
  const build = spawnSync("pnpm", ["run", "build"], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (build.status !== 0) {
    console.error("\nBUILD FAILED — nothing was copied.")
    process.exit(build.status ?? 1)
  }
}

const dist = join(repoRoot, "dist")
if (!existsSync(dist) || !statSync(dist).isDirectory()) {
  console.error(`\nNo dist/ to copy. Drop --no-build, or run \`npm run build\` first.`)
  process.exit(1)
}

for (const { installed } of targets) {
  console.log(`\nWriting ${installed}...`)
  // Unlink before copying, never write through. pnpm hardlinks package files
  // from its global content-addressable store, so truncating one in place would
  // rewrite the copy every other project on this machine shares. Removing the
  // directory entry first drops this tree's link and leaves the store alone.
  rmSync(join(installed, "dist"), { recursive: true, force: true })
  rmSync(join(installed, "package.json"), { force: true })
  cpSync(dist, join(installed, "dist"), { recursive: true })
  cpSync(join(repoRoot, "package.json"), join(installed, "package.json"))
}

console.log(
  `\nDone (${targets.length}). The product's own install command puts the published build back.`,
)
