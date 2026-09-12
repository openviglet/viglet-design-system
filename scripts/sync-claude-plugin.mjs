#!/usr/bin/env node
// VDS135 — copy the page contract into the Claude Code plugin's skill.
//
//   node scripts/sync-claude-plugin.mjs           # write the copies
//   node scripts/sync-claude-plugin.mjs --check   # write nothing, exit 1 on drift
//
// A plugin is installed from its own directory, so the skill cannot point at
// docs/ and has to carry the two documents. They are copies and never edited in
// place: the contract is written in docs/, and scripts/claude-plugin.test.ts
// fails when a copy differs, naming this script.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export const COPIES = [
  ["docs/BENTO-AUTHORING.md", "claude-plugin/skills/viglet-ds-pages/authoring.md"],
  ["docs/BENTO-BOUNDARY.md", "claude-plugin/skills/viglet-ds-pages/boundary.md"],
]

function main() {
  const checking = process.argv.includes("--check")
  const drifted = []
  for (const [from, to] of COPIES) {
    const text = readFileSync(join(root, from), "utf8")
    const at = join(root, to)
    if (existsSync(at) && readFileSync(at, "utf8") === text) continue
    drifted.push(to)
    if (!checking) {
      mkdirSync(dirname(at), { recursive: true })
      writeFileSync(at, text)
    }
  }

  if (drifted.length === 0) {
    console.log("sync-claude-plugin: the plugin's copies are current.")
  } else if (checking) {
    console.error(`sync-claude-plugin: out of date: ${drifted.join(", ")}\nRun node scripts/sync-claude-plugin.mjs`)
    process.exit(1)
  } else {
    console.log(`sync-claude-plugin: wrote ${drifted.join(", ")}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
