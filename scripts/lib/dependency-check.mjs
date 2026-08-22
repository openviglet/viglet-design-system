import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import semver from "semver"

/**
 * The version of `name` that a package installed at `packageDir` actually
 * resolves, or null when it resolves none.
 *
 * Walks node_modules from `packageDir` upwards by hand rather than going through
 * `createRequire`. Two reasons: a package need not expose `./package.json` in
 * its export map, and `createRequire` walks the path it is given literally — so
 * rooted at a symlink it finds the *consumer's* copy instead of the package's
 * own, which is exactly the mistake that produced this task.
 */
export function resolveInstalledVersion(packageDir, name) {
  let dir = packageDir
  for (;;) {
    const candidate = join(dir, "node_modules", ...name.split("/"), "package.json")
    if (existsSync(candidate)) {
      try {
        return JSON.parse(readFileSync(candidate, "utf8")).version ?? null
      } catch {
        return null
      }
    }
    const parent = dirname(dir)
    if (parent === dir) return null
    dir = parent
  }
}

/**
 * Which of `ranges` the installed tree at `packageDir` does not satisfy.
 *
 * `resolve` is injectable so the comparison can be tested without a node_modules
 * tree on disk.
 */
export function unsatisfiedDependencies(
  ranges,
  packageDir,
  resolve = resolveInstalledVersion,
) {
  const findings = []
  for (const [name, range] of Object.entries(ranges ?? {})) {
    const installed = resolve(packageDir, name)
    if (installed === null) {
      // Not installed at all. That is the product's own resolution to make —
      // a dependency it never needed is not this push's problem — so it is
      // reported as missing rather than as a mismatch.
      findings.push({ name, range, installed: null, kind: "missing" })
      continue
    }
    // A range this cannot parse is not evidence of a problem.
    if (!semver.validRange(range) || !semver.valid(installed)) continue
    if (!semver.satisfies(installed, range)) {
      findings.push({ name, range, installed, kind: "mismatch" })
    }
  }
  return findings
}

/** The message a caller prints for one target's findings. */
export function describeFindings(findings, targetLabel) {
  const mismatches = findings.filter((f) => f.kind === "mismatch")
  if (mismatches.length === 0) return null

  const lines = [
    `  ${targetLabel}`,
    `    ${mismatches.length} dependency range(s) the installed tree does not satisfy:`,
  ]
  for (const f of mismatches) {
    lines.push(`      ${f.name}  needs ${f.range}, installed ${f.installed}`)
  }
  lines.push(
    "",
    "    Copying dist cannot fix this: it writes files, it does not re-resolve",
    "    dependencies. The build would fail on symbols the installed version does",
    "    not export, and the failure would look like a defect in the change under",
    "    test. Run the product's own install first, or pass --skip-dep-check to",
    "    push anyway.",
  )
  return lines.join("\n")
}
