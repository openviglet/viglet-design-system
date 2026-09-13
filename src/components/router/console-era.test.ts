import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// The swap table and the era-neutral list live in scripts/lib/console-era.mjs,
// which the chrome census (VDS144) reads too.
import { CONSOLE_ERA, ERA_NEUTRAL } from "../../../scripts/lib/console-era.mjs"

/**
 * VDS147 — the console era, removed.
 *
 * This guard used to assert the opposite: that all eleven were still exported
 * and each carried an `@deprecated` notice naming its bento replacement. The
 * non-goal it served held removal until `pnpm chrome:census` read zero across
 * every consumer, and the reading came. So the assertion flips rather than
 * being deleted — a removal nothing guards is one a re-export undoes, and the
 * names are exactly the ones a muscle-memory import reaches for.
 *
 * The census keeps reading the same table, which is why it stays: a product
 * still importing `PageHeader` should be told where it went, not that the name
 * means nothing here.
 */

const routerDir = resolve(import.meta.dirname)
const repoRoot = resolve(routerDir, "..", "..", "..")
const barrelPath = join(routerDir, "index.ts")
const exportsPath = join(repoRoot, "dist", "exports.json")

const ERA = Object.keys(CONSOLE_ERA)

/** Every shipped source in the barrel's directory, read once. */
const ROUTER_SOURCES = readdirSync(routerDir)
  .filter((f) => f.endsWith(".tsx") && !/\.(test|stories)\./.test(f))
  .map((f) => ({ name: f, text: readFileSync(join(routerDir, f), "utf8") }))

/**
 * The names a barrel publishes, as published: `X as Y` is a promise about `Y`.
 *
 * Matched exactly rather than by substring, because two of the eleven are
 * `Page` and `PageContent` — a word search for those finds `BreadcrumbPage` and
 * the comment above the exports, and a guard that fails on its own prose is one
 * the next person deletes.
 */
export function publishedNames(source: string): Set<string> {
  const names = new Set<string>()
  for (const clause of source.matchAll(/export\s*(?:type\s*)?\{([^}]*)\}/g)) {
    for (const part of clause[1].split(",")) {
      const spelt = part.trim().replace(/^type\s+/, "")
      if (!spelt) continue
      const [, alias] = spelt.split(/\s+as\s+/).map((s) => s.trim())
      names.add(alias ?? spelt)
    }
  }
  return names
}

describe("the console era has left the package", () => {
  it("declares none of the eleven under router/", () => {
    const surviving: string[] = []
    for (const name of ERA) {
      const pattern = new RegExp(String.raw`export (const|function) ${name}\b`)
      const file = ROUTER_SOURCES.find(({ text }) => pattern.test(text))
      if (file) surviving.push(`${name} (${file.name})`)
    }
    expect(surviving, "these still declare a console-era component").toEqual([])
  })

  it("publishes none of them from the barrel", () => {
    const published = publishedNames(readFileSync(barrelPath, "utf8"))
    expect(ERA.filter((name) => published.has(name))).toEqual([])
  })

  it("still publishes the three the bento layer imports itself", () => {
    const published = publishedNames(readFileSync(barrelPath, "utf8"))
    // Deprecating or dropping one of these deprecates the bento layer, which is
    // the half of the swap table that is not going anywhere.
    expect(ERA_NEUTRAL.filter((name) => !published.has(name))).toEqual([])
  })

  /**
   * The subpath is what a consumer actually imports from, and `exports.json`
   * is the built answer for every one of them at once — not just `./router`,
   * so a name re-homed under the root barrel is caught too. Skipped without a
   * build; CI builds first.
   */
  it("resolves none of them from any published subpath", (ctx) => {
    if (!existsSync(exportsPath)) ctx.skip()
    const { entries } = JSON.parse(readFileSync(exportsPath, "utf8"))
    const found: string[] = []
    for (const [subpath, entry] of Object.entries<{ values?: string[]; types?: string[] }>(entries)) {
      for (const name of [...(entry.values ?? []), ...(entry.types ?? [])]) {
        if (ERA.includes(name)) found.push(`${name} from "${subpath}"`)
      }
    }
    expect(found, "a console-era name is importable again").toEqual([])
  })

  it("keeps the swap table in the README, which is now a migration note", () => {
    const readme = readFileSync(join(repoRoot, "README.md"), "utf8")
    for (const [name, replacement] of Object.entries(CONSOLE_ERA)) {
      expect(readme, `${name} is missing from the README's swap table`).toContain(`\`${name}\``)
      if (replacement) {
        expect(readme, `the README does not name ${replacement} for ${name}`).toContain(`\`${replacement}\``)
      }
    }
  })
})
