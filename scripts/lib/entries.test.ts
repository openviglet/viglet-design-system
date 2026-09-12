import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import viteConfig from "../../vite.config"
import {
  CLIENT_ENTRIES,
  ENTRIES,
  ROUTER_ENTRIES,
  SERVER_ENTRIES,
  emittedFiles,
} from "./entries.mjs"

// VDS120 — `CLIENT_ENTRIES` was a hand-maintained Set in vite.config.ts and an
// independent literal in check-dist.mjs, beside `SERVER_ENTRIES`, with
// `ROUTER_ENTRIES` a third. The check iterated its own copy rather than the
// build's entries, so an eighth entry added to the build alone shipped with no
// "use client" banner and the loop never looked at it — VDS71's gate passing on
// exactly the kind of file it was written to catch, with the failure landing in
// a Next consumer's build.
//
// What is asserted here is the mechanism that closes it, which is the line
// somebody deletes while tidying: the build reads this module, so an entry
// cannot exist without a row, and a row is classified or it is not a row.

const root = resolve(import.meta.dirname, "..", "..")

const buildEntries = () => {
  const lib = viteConfig.build?.lib
  const entry = typeof lib === "object" && lib !== null ? lib.entry : undefined
  return typeof entry === "object" && entry !== null && !Array.isArray(entry)
    ? (entry as Record<string, string>)
    : {}
}

describe("one list of entries", () => {
  it("is what the build builds", () => {
    // Not a subset either way: an entry here that the build skips ships
    // nothing, and an entry the build adds without a row is the defect itself.
    expect(Object.keys(buildEntries()).sort()).toEqual(Object.keys(ENTRIES).sort())
  })

  it("names a source file that is there", () => {
    for (const [name, { source }] of Object.entries(ENTRIES)) {
      expect(existsSync(join(root, source)), `${name} names ${source}`).toBe(true)
    }
  })

  it("puts every entry on one side of the RSC boundary", () => {
    // check-dist iterates ENTRIES and asks each one which side it is on. An
    // entry in neither set would be looked at and then silently skipped, which
    // is the shape of the defect this replaced.
    for (const name of Object.keys(ENTRIES)) {
      expect(
        CLIENT_ENTRIES.has(name) !== SERVER_ENTRIES.has(name),
        `${name} is on neither side of the boundary, or on both`,
      ).toBe(true)
    }
    expect(CLIENT_ENTRIES.size + SERVER_ENTRIES.size).toBe(Object.keys(ENTRIES).length)
  })

  it("keeps the router to the entries that declare it", () => {
    // The other list that was restated. react-router-dom is an optional peer,
    // so a consumer told so and handed a chunk importing it fails to build.
    expect([...ROUTER_ENTRIES].sort()).toEqual(["bento", "router"])
    for (const name of ROUTER_ENTRIES) expect(ENTRIES[name]).toBeDefined()
  })

  it("names the two files the build emits for one entry", () => {
    expect(emittedFiles("bento")).toEqual(["bento.es.js", "bento.cjs"])
  })

  it("publishes each entry under a subpath", () => {
    // An entry nothing exports is built and unreachable, which no other check
    // would notice: check-dist reads the exports map for the reverse direction.
    const exportsMap = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).exports
    const targets = JSON.stringify(Object.values(exportsMap))

    for (const name of Object.keys(ENTRIES)) {
      expect(targets, `${name} is built and reachable from no subpath`).toContain(
        `./dist/${name}.es.js`,
      )
    }
  })
})
