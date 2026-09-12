#!/usr/bin/env node
// Build this checkout and push it into every local product that depends on it.
//
// This replaces the two copy-ds.cmd scripts, which each hardcoded a version
// directory (shio/shio-react, turing/2026.1/frontend) and so pointed at nothing
// after the checkouts moved to 2026.3. Where each consumer is checked out is
// read from consumers.json (VDS130), and where each one keeps the installed copy
// is read by following the link its own package manager created. The products
// are pnpm workspaces today and npm yesterday; neither is named here.
//
//   pnpm use:local              # every consumer in consumers.json on this machine
//   pnpm use:local --list       # show what would be written to
//   pnpm use:local <id|dir> …   # push to these consumers only
//   pnpm use:local --no-build   # reuse the dist already on disk
//   pnpm use:local --all        # let the fallback walk include checkouts off the current line
//   pnpm use:local --skip-dep-check   # push over a tree whose deps are behind
//   pnpm use:local --register p # read the consumers from p instead
//
// dist and package.json are copied over the installed copy in place. Nothing is
// linked: a link makes the product resolve this checkout's node_modules too,
// which loads a second React and breaks hooks in ways that look like product
// bugs. Nothing in the product's manifest or lockfile is touched either, so
// `pnpm install` in the product puts the published build back.

import { spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { resolveCheckouts } from "./lib/checkouts.mjs"
import { describeFindings, unsatisfiedDependencies } from "./lib/dependency-check.mjs"

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
const skipDepCheck = args.includes("--skip-dep-check")
// The flag's value is not a consumer. Skipped by its index, and only when the
// flag is there: VDS78 is what `indexOf(...) + 1` does when it is not.
const registerFlag = args.indexOf("--register")
const registerValueAt = registerFlag === -1 ? -1 : registerFlag + 1
const registerPath = resolve(
  registerFlag === -1 ? join(repoRoot, "consumers.json") : (args[registerValueAt] ?? ""),
)
const explicit = args.filter((a, i) => !a.startsWith("--") && i !== registerValueAt)

if (!existsSync(registerPath)) {
  console.error(`No consumer register at ${registerPath}.`)
  process.exit(1)
}
const register = JSON.parse(readFileSync(registerPath, "utf8"))
const declaredPackages = new Set(register.consumers.map((c) => c.package))

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

const checkouts = resolveCheckouts(register, repoRoot, currentLine)

function packageName(dir) {
  try {
    return JSON.parse(readFileSync(join(dir, "package.json"), "utf8")).name
  } catch {
    return null
  }
}

let consumers
if (explicit.length) {
  // An argument naming a declared consumer means its checkout; anything else is
  // a directory, as it always was.
  consumers = explicit.map((arg) => {
    const consumer = register.consumers.find((c) => c.id === arg)
    if (!consumer) return resolve(arg)
    const hit = checkouts.found.find((f) => f.consumer.id === arg)
    if (!hit) {
      console.error(
        `${arg} is declared in ${registerPath}, and its checkout is not on this machine` +
          (consumer.offMachine ? " (offMachine)." : `: ${consumer.checkout}.`),
      )
      process.exit(1)
    }
    return hit.path
  })
} else {
  for (const { consumer, path } of checkouts.missing) {
    console.error(
      `  ${consumer.id} declares checkout ${consumer.checkout ?? "(none)"}, which resolves to ` +
        `${path ?? "nothing"} and holds no package.json.\n` +
        "    Check it out there, correct the path in consumers.json, or mark it offMachine.",
    )
  }
  if (checkouts.missing.length > 0) console.error("")
  consumers = checkouts.found.map((f) => f.path)

  // The walk survives only for a consumer the register does not name yet, and
  // says so when it finds one: a consumer reached this way is a line missing
  // from consumers.json, which every guard reads.
  const productsRoot = resolve(repoRoot, "..")
  const reached = new Set(consumers.map((p) => realpathSync(p)))
  const discovered = discover(productsRoot).filter(
    (p) => !reached.has(realpathSync(p)) && !declaredPackages.has(packageName(p)),
  )
  const onLine = discovered.filter((p) => p.split(/[\\/]/).includes(currentLine))
  const undeclared = includeAll ? discovered : onLine
  const skipped = discovered.length - undeclared.length
  if (skipped > 0) {
    console.log(`Ignoring ${skipped} undeclared checkout(s) off the ${currentLine} line (--all includes them).\n`)
  }
  for (const p of undeclared) {
    console.log(`  ${packageName(p)} at ${p} depends on ${PACKAGE_NAME} and is not in consumers.json.`)
  }
  consumers.push(...undeclared)
}

if (consumers.length === 0) {
  console.error(
    `No consumer declared in ${registerPath} is checked out on this machine.\n` +
      "Each consumer's checkout is declared there, relative to this repository; correct the\n" +
      "paths it names, or pass the consumers explicitly: node scripts/use-local.mjs <id|dir> [...]",
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

// Copying dist writes files; it does not re-resolve dependencies. So if a range
// moved here since the product last installed, the manifest this is about to
// copy asks for a version the directory beside it does not have, and the product
// fails to build on symbols that version does not export. That happened, and it
// read as a defect in the design-system change rather than as a stale tree.
if (!skipDepCheck) {
  const ourRanges = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).dependencies
  const problems = []
  for (const { consumer, installed } of targets) {
    const described = describeFindings(
      unsatisfiedDependencies(ourRanges, installed),
      consumer,
    )
    if (described) problems.push(described)
  }
  if (problems.length > 0) {
    // --list writes nothing, so it reports and leaves rather than refusing.
    const header = listOnly
      ? "\nThese trees are behind this checkout, and a push would be refused:\n"
      : "\nNot pushed. The installed tree is behind this checkout:\n"
    console.error(header)
    for (const problem of problems) console.error(problem)
    console.error("")
    if (!listOnly) process.exit(1)
  }
}

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

/**
 * What a publish would carry, read rather than assumed.
 *
 * `dist` used to be the whole of this copy, which quietly made the loop a
 * different thing from a publish: `scripts/check-duplicates.mjs` has been in
 * `files` since VDS5 and never once arrived in a consumer this way, so a change
 * to that gate could only be tried through a real tarball — which is the thing
 * this script exists to avoid. Reading the list keeps the two the same shape by
 * construction, and anything added to `files` later arrives here for free.
 *
 * `package.json` is copied beside them because npm always includes it and never
 * asks `files` about it.
 */
const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))
const carried = manifest.files ?? []

const patterned = carried.filter((entry) => /[*?[\]{}!]/.test(entry))
if (patterned.length > 0) {
  console.error(`\n\`files\` uses a pattern this script does not expand: ${patterned.join(", ")}`)
  console.error(`Name it outright, or teach this script the pattern — guessing would ship a subset`)
  console.error(`and a subset is what this whole script is here to stop.`)
  process.exit(1)
}

const absent = carried.filter((entry) => !existsSync(join(repoRoot, entry)))
if (absent.length > 0) {
  console.error(`\n\`files\` names something this checkout does not have: ${absent.join(", ")}`)
  process.exit(1)
}

for (const { installed } of targets) {
  console.log(`\nWriting ${installed}...`)
  for (const entry of [...carried, "package.json"]) {
    const to = join(installed, entry)
    // Unlink before copying, never write through. pnpm hardlinks package files
    // from its global content-addressable store, so truncating one in place would
    // rewrite the copy every other project on this machine shares. Removing the
    // directory entry first drops this tree's link and leaves the store alone.
    rmSync(to, { recursive: true, force: true })
    mkdirSync(dirname(to), { recursive: true })
    cpSync(join(repoRoot, entry), to, { recursive: true })
  }
  console.log(`  ${[...carried, "package.json"].join(", ")}`)
}

console.log(
  `\nDone (${targets.length}). The product's own install command puts the published build back.`,
)
