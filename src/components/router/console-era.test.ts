import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

const routerDir = resolve(import.meta.dirname)
const distDir = resolve(routerDir, "..", "..", "..", "dist")
const barrelPath = join(routerDir, "index.ts")

/**
 * The console page vocabulary, and the bento export a new page should reach for
 * instead. This is the swap table the README publishes; keeping it here as data
 * is what lets the assertions below hold both files to it.
 *
 * `Page` and `PageContent` map to nothing on purpose: the bento layer ships no
 * single shell, because the shell is where a product is itself.
 */
const CONSOLE_ERA: Record<string, string | null> = {
  PageHeader: "BentoHero",
  SubPageHeader: "BentoHero",
  StickyPageHeader: "useBentoScrollFade",
  GridList: "BentoListPage",
  BlankSlate: "BentoEmptyState",
  InternalSidebar: "BentoNavRail",
  NavMain: "BentoNavRail",
  NavUser: "BentoUserMenu",
  SubPage: "BentoEntityShell",
  Page: null,
  PageContent: null,
}

/**
 * Exports from the same barrel that are *not* console-era: the bento layer
 * imports them itself, so marking them deprecated would deprecate bento.
 */
const ERA_NEUTRAL = ["DialogDelete", "LoadProvider", "GradientButtonLink"]

/** Every shipped source in the barrel's directory, read once. */
const ROUTER_SOURCES = readdirSync(routerDir)
  .filter((f) => f.endsWith(".tsx") && !/\.(test|stories)\./.test(f))
  .map((f) => ({ name: f, text: readFileSync(join(routerDir, f), "utf8") }))

/**
 * Where a name is declared, and whether the doc comment attached to that
 * declaration carries `@deprecated` — which is the only place an editor reads
 * it from. Returns null when nothing declares the name, so a caller can tell
 * "not deprecated" apart from "gone", which is the distinction that made an
 * earlier version of this guard pass while asserting nothing.
 */
function declarationOf(name: string): { file: string; text: string; deprecated: boolean } | null {
  const pattern = new RegExp(String.raw`export (const|function) ${name}\b`)
  for (const { name: file, text } of ROUTER_SOURCES) {
    const at = text.search(pattern)
    if (at < 0) continue
    return { file, text, deprecated: text.slice(Math.max(0, at - 900), at).includes("@deprecated") }
  }
  return null
}

function distDeclarations(): string {
  const found: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (full.endsWith(".d.ts")) found.push(readFileSync(full, "utf8"))
    }
  }
  walk(distDir)
  return found.join("\n")
}

describe("the console era says it is the console era", () => {
  it("marks every console-era component deprecated, on the declaration itself", () => {
    const unmarked: string[] = []
    for (const name of Object.keys(CONSOLE_ERA)) {
      const decl = declarationOf(name)
      expect(decl, `${name} is no longer declared under router/`).not.toBeNull()
      // The notice has to be the doc comment attached to the declaration, not
      // merely somewhere in the file — that is what an editor reads.
      if (!decl!.deprecated) unmarked.push(name)
    }
    expect(unmarked, "these carry no @deprecated on the declaration").toEqual([])
  })

  it("names the bento replacement wherever one exists", () => {
    const missing: string[] = []
    for (const [name, replacement] of Object.entries(CONSOLE_ERA)) {
      if (!replacement) continue
      const decl = declarationOf(name)
      if (!decl?.text.includes(`@see ${replacement}`)) missing.push(`${name} -> ${replacement}`)
    }
    expect(missing, "the deprecation notice does not name the swap").toEqual([])
  })

  it("leaves the era-neutral exports alone — bento itself imports them", () => {
    const wrongly: string[] = []
    for (const name of ERA_NEUTRAL) {
      const decl = declarationOf(name)
      // `GradientButtonLink` is exported from a trailing `export { … }`, so it
      // has no doc comment to carry a notice — nothing to assert, and saying so
      // beats a silent `continue` that hides a rename.
      if (!decl) {
        expect(
          readFileSync(barrelPath, "utf8"),
          `${name} declares nothing and is not re-exported either — has it been renamed?`,
        ).toContain(name)
        continue
      }
      if (decl.deprecated) wrongly.push(name)
    }
    expect(wrongly, "the bento layer imports these, so deprecating them deprecates bento").toEqual([])
  })

  it("keeps every console-era export exported — removal is a later decision", () => {
    const barrel = readFileSync(barrelPath, "utf8")
    for (const name of [...Object.keys(CONSOLE_ERA), ...ERA_NEUTRAL]) {
      expect(barrel, `${name} left the barrel; the non-goal forbids that until both products cut over`).toMatch(
        new RegExp(String.raw`\b${name}\b`),
      )
    }
  })

  /**
   * The notice is only worth writing if a consumer sees it, and a consumer sees
   * the `.d.ts`, not this source. Skipped without a build; CI builds first.
   */
  it("carries the notice into the published types", () => {
    if (!existsSync(distDir)) return
    const dts = distDeclarations()
    const missing: string[] = []

    for (const name of Object.keys(CONSOLE_ERA)) {
      const at = dts.search(new RegExp(String.raw`export declare (const|function) ${name}\b`))
      if (at < 0) {
        missing.push(`${name} (no declaration emitted)`)
        continue
      }
      if (!dts.slice(Math.max(0, at - 900), at).includes("@deprecated")) missing.push(name)
    }

    expect(missing, "a consumer's editor will not strike these through").toEqual([])
  })

  it("publishes the same swap table in the README", () => {
    const readme = readFileSync(resolve(routerDir, "..", "..", "..", "README.md"), "utf8")
    for (const [name, replacement] of Object.entries(CONSOLE_ERA)) {
      expect(readme, `${name} is missing from the README's swap table`).toContain(`\`${name}\``)
      if (replacement) {
        expect(readme, `the README does not name ${replacement} for ${name}`).toContain(`\`${replacement}\``)
      }
    }
  })
})
