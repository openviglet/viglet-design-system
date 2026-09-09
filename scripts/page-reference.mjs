#!/usr/bin/env node
/**
 * Vendor this package's page reference into a consuming repository.
 *
 * The catalogue answers "does this component exist". What it cannot answer is
 * "does this page read as the same product", and the answer to that lives in
 * two documents and nine artboards which are not in anybody's `node_modules`
 * by reading them: a contract a product author has to browse a repository to
 * find is one they read after the fifth screen, which is what BENTO-AUTHORING's
 * own opening warns against.
 *
 * So the surfaces are written into the consumer, where an agent session and a
 * person both trip over them. Two disciplines, borrowed rather than invented:
 *
 *   copy        rewritten on every run, and drift is a finding. Every byte is
 *               this package's statement; a vendored authority that has drifted
 *               is worse than none, because it is read with the same trust.
 *   declaration this project's entries re-derived inside a file the adopter
 *               also writes in. Compared as parsed JSON, never as bytes: their
 *               indentation is not drift, and a check that fails on whitespace
 *               is a check nobody leaves switched on.
 *
 * Usage:
 *   viglet-ds-page-reference [--root <dir>] [--canvas-dir <rel>]
 *   viglet-ds-page-reference --check          # report, write nothing, exit 1 on drift
 *
 *   --root <dir>         the consuming repository (default: the working directory)
 *   --canvas-dir <rel>   where the artboards go (default: docs/design)
 *   --check              report what would change and write nothing
 *   --json               machine-readable form
 *   --warn               report drift and still exit 0
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
/** The package root, whether that is this checkout or a `node_modules` copy. */
const payload = resolve(here, "..")

const argv = process.argv.slice(2)
function flag(name) {
  return argv.includes(`--${name}`)
}
function value(name, fallback) {
  const at = argv.indexOf(`--${name}`)
  return at === -1 || at === argv.length - 1 ? fallback : argv[at + 1]
}

const root = resolve(value("root", process.cwd()))
const canvasDir = value("canvas-dir", "docs/design")
const checking = flag("check")
const asJson = flag("json")
const warnOnly = flag("warn")

const version = JSON.parse(readFileSync(join(payload, "package.json"), "utf8")).version

const SKILL_DIR = ".claude/skills/viglet-ds-pages"
const SKILL = `${SKILL_DIR}/SKILL.md`
const REFERENCE = join(payload, "docs", "reference")

/**
 * The one file written new rather than copied, and it states no rule of its own
 * -- it says which pages hold them and where the artboards landed in *this*
 * repository, which is the one fact the package cannot know.
 */
function orientation(dir, artboards) {
  return `---
name: viglet-ds-pages
description: Building or changing a page with @viglet/viglet-design-system/bento -- the shell, the three page shapes, the panel, and which tokens a product claims. Load before the first screen, and before adding a region to one.
vds-version: ${version}
---

# Pages in the Viglet design system

This is vendored from \`@viglet/viglet-design-system@${version}\` and refreshed by
\`viglet-ds-page-reference\`. Do not edit these files here: the next run rewrites them, and
a correction belongs in the package so every consumer gets it.

## Read first

- **[authoring.md](authoring.md)** -- the contract. The shell and who owns each region, the
  three page shapes, the panel, colour and the tokens a product claims, i18n, accessibility,
  responsive, tests. Read it before the first screen, not after the fifth.
- **[boundary.md](boundary.md)** -- which components are the shared layer and which stay in
  a product, and why.

## And look at

\`${dir}/vds-*.dc.html\` -- ${artboards} artboards, the contract drawn: every region of a page
with an ownership key, the reading column owned two ways, what \`--primary\` reaches, the page
shapes, the panel, and both grounds with their ratios. They are laid out by
\`${dir}/canvas.json\`, whose \`vds-\` pages and artboards belong to the package; everything
else in that file is this repository's own and is preserved.

An artboard opens in a browser straight from the file tree.

## Two rules that are easy to get wrong

- A page sets no max width, no gutters and no vertical rhythm. The shell sets them once.
- A product claims \`--primary\` through the four \`--vg-primary-*-base\` inputs at \`:root\`,
  never by setting \`--vg-primary\` itself, which would key the dark ground to the light value.

## Checking it is current

\`\`\`bash
viglet-ds-page-reference --check
\`\`\`
`
}

/** A verbatim copy, rewritten every run. Drift is the finding. */
function copied(to, text) {
  const at = join(root, to)
  const existed = existsSync(at)
  const drifted = !existed || readFileSync(at, "utf8") !== text
  return { to, kind: "copy", text, existed, drifted }
}

const artboards = existsSync(REFERENCE)
  ? readdirSync(REFERENCE)
      .filter((name) => name.endsWith(".dc.html"))
      .sort()
  : []

if (artboards.length === 0) {
  console.error(`No artboards in ${REFERENCE}. This is not a copy of the package that ships them.`)
  process.exit(1)
}

/**
 * The consumer's own canvas, with this package's pages re-derived inside it.
 *
 * Their artboards, their pages, their notes and their launch view are carried
 * through untouched. Ours are recognised by the `vds-` prefix and replaced, so
 * an artboard the package drops stops being listed rather than lingering.
 */
function declaration() {
  const to = `${canvasDir}/canvas.json`
  const at = join(root, to)
  const ours = JSON.parse(readFileSync(join(REFERENCE, "canvas.json"), "utf8"))
  const mine = (name) => name.startsWith("vds-")

  let current = null
  if (existsSync(at)) {
    try {
      current = JSON.parse(readFileSync(at, "utf8"))
    } catch {
      console.error(`${to} is not JSON this can merge into. Fix or move it; nothing was written.`)
      process.exit(1)
    }
    if (current === null || typeof current !== "object" || Array.isArray(current)) {
      console.error(`${to} is not a JSON object. Nothing was written.`)
      process.exit(1)
    }
  }

  const theirs = current ?? {}
  const merged = {
    ...theirs,
    pages: [...(theirs.pages ?? []).filter((p) => !mine(p.id)), ...ours.pages],
    artboards: [
      ...(theirs.artboards ?? []).filter((a) => !mine(a.file)),
      ...ours.artboards.map((a) => ({ ...a, file: `vds-${a.file}` })),
    ],
    annotations: [
      ...(theirs.annotations ?? []).filter((n) => !mine(n.id)),
      ...(ours.annotations ?? []),
    ],
    // Their opening view, or ours only where they have none.
    launch: theirs.launch ?? ours.launch,
  }

  const text = `${JSON.stringify(merged, null, 2)}\n`
  return {
    to,
    kind: "declaration",
    text,
    existed: current !== null,
    // Parsed, not byte-compared: their formatter is not drift.
    drifted: current === null || JSON.stringify(current) !== JSON.stringify(merged),
  }
}

const surfaces = [
  copied(SKILL, orientation(canvasDir, artboards.length)),
  copied(`${SKILL_DIR}/authoring.md`, readFileSync(join(payload, "docs", "BENTO-AUTHORING.md"), "utf8")),
  copied(`${SKILL_DIR}/boundary.md`, readFileSync(join(payload, "docs", "BENTO-BOUNDARY.md"), "utf8")),
  ...artboards.map((name) =>
    copied(`${canvasDir}/vds-${name}`, readFileSync(join(REFERENCE, name), "utf8")),
  ),
  declaration(),
]

/**
 * Which direction the surfaces are behind in.
 *
 * Where the vendored skill was written by a newer package than the one running,
 * "refresh" means downgrade and every word of a drift report would be wrong. So
 * it is named and refused instead.
 */
const wired = existsSync(join(root, SKILL))
const stamped = wired
  ? (/^vds-version:\s*(\S+)\s*$/m.exec(readFileSync(join(root, SKILL), "utf8"))?.[1] ?? null)
  : null
const ahead =
  stamped !== null &&
  stamped !== version &&
  stamped.localeCompare(version, undefined, { numeric: true }) > 0

const changing = surfaces.filter((s) => s.drifted)

/**
 * A `vds-` artboard this package no longer ships.
 *
 * Part of the plan rather than a sweep at the end of a write: a reference that
 * dropped an artboard and left it behind in every consumer is drift in the one
 * direction a copy cannot fix, and it has to be reported by `--check` for the
 * gate to mean what it says.
 */
const shipped = new Set(artboards.map((name) => `vds-${name}`))
const orphans = existsSync(join(root, canvasDir))
  ? readdirSync(join(root, canvasDir))
      .filter((name) => name.startsWith("vds-") && name.endsWith(".dc.html") && !shipped.has(name))
      .map((name) => `${canvasDir}/${name}`)
  : []

/** created / updated, in the conditional under `--check` and the past tense after a write. */
function state(surface) {
  if (!surface.drifted) return "unchanged"
  if (!surface.existed) return checking ? "would create" : "created"
  return checking ? "would update" : "updated"
}

function code() {
  if (!wired) return "page-reference.absent"
  return changing.length > 0 || orphans.length > 0 ? "page-reference.stale" : null
}

if (asJson) {
  console.log(
    JSON.stringify(
      {
        version,
        root,
        canvasDir,
        wired,
        stamped,
        ahead,
        code: code(),
        surfaces: surfaces.map((s) => ({ to: s.to, kind: s.kind, state: state(s) })),
        orphans,
      },
      null,
      2,
    ),
  )
} else if (ahead) {
  console.error(
    `\n${SKILL} was written by ${stamped} and this package is ${version}: the surfaces here are ` +
      `ahead, not behind.\nRefreshing them would be a downgrade, so nothing was written. Upgrade ` +
      `the package, or run this from the checkout that matches.`,
  )
  process.exit(1)
} else if (!wired && checking) {
  // The vendored skill is the discriminator: an unwired project pays one stat
  // and is told what it is missing, rather than reading nine lines of drift.
  console.log(`\npage-reference.absent  ${root}`)
  console.log(`  This repository has no vendored page reference.`)
  console.log(`  Without it a session has no contract for the shell, the page shapes or the`)
  console.log(`  tokens a product claims -- the four decisions that make two products built`)
  console.log(`  from this package stop looking like one.`)
  console.log(`\n  viglet-ds-page-reference        writes ${surfaces.length} surface(s)`)
} else if (changing.length === 0 && orphans.length === 0) {
  console.log(`\nThe page reference is current (${version}), ${surfaces.length} surface(s).`)
} else {
  const heading = checking ? "page-reference.stale" : `Writing into ${root}`
  console.log(`\n${heading}  ${version}`)
  for (const s of surfaces) {
    console.log(`  ${state(s).padEnd(13)} ${s.to}`)
  }
  for (const orphan of orphans) {
    console.log(`  ${(checking ? "would remove" : "removed").padEnd(13)} ${orphan}`)
  }
  if (!checking) {
    for (const s of changing) {
      const at = join(root, s.to)
      mkdirSync(dirname(at), { recursive: true })
      writeFileSync(at, s.text, "utf8")
    }
    for (const orphan of orphans) rmSync(join(root, orphan))
    console.log(`\nDone. Wire \`viglet-ds-page-reference --check\` into this repository's lint.`)
  }
}

const drifting = !wired || changing.length > 0 || orphans.length > 0
process.exit(checking && drifting && !warnOnly ? 1 : 0)
