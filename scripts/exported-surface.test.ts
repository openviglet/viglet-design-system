import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

/**
 * VDS112 — a name exported from a component file and re-exported by nothing.
 *
 * `check-exports` asks whether every published subpath resolves, requires and
 * type-checks. It cannot ask the question this does, because it reads
 * `dist/exports.json` — the catalogue of what *did* reach an entry — so a name
 * the barrel forgot is simply absent from both sides of its comparison. Three
 * Popover parts were demonstrated in the catalogue and importable from nowhere,
 * and `useSidebarOptional`, written so a Module Federation remote can probe for
 * a provider without throwing, could only be reimplemented at the call site.
 *
 * It is a test rather than a build script for the same reason: this needs no
 * `dist`, so it answers on a working tree and in `pnpm test`, where the gap is
 * introduced, instead of at the release that discovers it.
 *
 * **Matched by origin, never by name.** `components/router/index.ts` publishes
 * `ItemActionProps as VigGridItemActionProps`, and a reader comparing the names
 * a barrel emits against the names a file declares calls that one missing. So
 * every export is followed back to the file and the local name it came from.
 */

const root = resolve(import.meta.dirname, "..")

/**
 * The library entries, as `vite.config.ts` declares them. Read from the config
 * rather than restated: a list typed out here is one that goes stale the day an
 * entry is added, which is the defect VDS120 is open about elsewhere.
 */
async function entryFiles(): Promise<string[]> {
  const config = (await import("../vite.config")).default
  const lib = config.build?.lib
  const entry = typeof lib === "object" && lib !== null ? lib.entry : undefined
  const files =
    typeof entry === "object" && entry !== null && !Array.isArray(entry)
      ? Object.values(entry as Record<string, string>)
      : []
  return files.map((file) => resolve(file))
}

const parsed = new Map<string, ts.SourceFile>()
function parse(file: string): ts.SourceFile {
  const cached = parsed.get(file)
  if (cached) return cached
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  parsed.set(file, source)
  return source
}

/** A relative specifier as a file on disk, in the order a bundler would try. */
function moduleFile(from: string, specifier: string): string | undefined {
  if (!specifier.startsWith(".")) return undefined
  const base = resolve(dirname(from), specifier)
  return [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
    (candidate) => existsSync(candidate),
  )
}

/** The names a file declares and exports itself — nothing it re-exports. */
function declaredIn(file: string): string[] {
  const names: string[] = []

  for (const statement of parse(file).statements) {
    if (ts.isExportDeclaration(statement)) {
      // `export { a, b as c }` with no `from`: a local declaration published
      // through a list, which is how section-card and sidebar export theirs.
      if (statement.exportClause && ts.isNamedExports(statement.exportClause) && !statement.moduleSpecifier) {
        for (const element of statement.exportClause.elements) {
          names.push((element.propertyName ?? element.name).text)
        }
      }
      continue
    }

    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : []
    if (!modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text)
      }
    } else if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name && ts.isIdentifier(statement.name)) names.push(statement.name.text)
    }
  }

  return names
}

/** Where a name came from, as the file that declared it and the name it had there. */
const originOf = (file: string, name: string) => `${file}::${name}`

/**
 * What a module publishes, as published name → origin. Recursive, because a
 * barrel of barrels is what `src/index.ts` is.
 */
const surfaces = new Map<string, Map<string, string>>()
function surfaceOf(file: string, open = new Set<string>()): Map<string, string> {
  const cached = surfaces.get(file)
  if (cached) return cached
  // A cycle between two barrels is not this gate's finding, and recursing
  // through one forever is not an answer to anything.
  if (open.has(file)) return new Map()
  open.add(file)

  const surface = new Map<string, string>()
  for (const name of declaredIn(file)) surface.set(name, originOf(file, name))

  for (const statement of parse(file).statements) {
    if (!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    const target = moduleFile(file, statement.moduleSpecifier.text)
    if (!target) continue
    const inner = surfaceOf(target, open)

    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        const local = (element.propertyName ?? element.name).text
        surface.set(element.name.text, inner.get(local) ?? originOf(target, local))
      }
    } else if (!statement.exportClause) {
      for (const [name, origin] of inner) surface.set(name, origin)
    }
  }

  open.delete(file)
  surfaces.set(file, surface)
  return surface
}

/** Every shipped component file — a story or a test exports nothing a product buys. */
function componentFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "__screenshots__") continue
      componentFiles(full, found)
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !/\.(test|spec|stories)\./.test(entry.name) &&
      !/^index\.tsx?$/.test(entry.name)
    ) {
      found.push(full)
    }
  }
  return found
}

const shown = (file: string) => relative(root, file).replaceAll("\\", "/")

describe("every exported name reaches a published subpath", () => {
  it("follows a rename back to the file it came from", () => {
    // Non-vacuous, and the specific shape that made a name-matching reader wrong.
    const routerBarrel = surfaceOf(join(root, "src/components/router/index.ts"))
    const gridList = join(root, "src/components/router/grid.list.tsx")

    expect(declaredIn(gridList)).toContain("ItemActionProps")
    expect(routerBarrel.get("VigGridItemActionProps")).toBe(originOf(gridList, "ItemActionProps"))
  })

  it("names every component export no entry re-exports", async () => {
    const entries = await entryFiles()
    expect(entries.length, "no entry was read from vite.config.ts").toBeGreaterThan(3)

    const published = new Set<string>()
    for (const entry of entries) {
      for (const origin of surfaceOf(entry).values()) published.add(origin)
    }
    expect(published.size, "the entries publish nothing, so this asserts nothing").toBeGreaterThan(100)

    const files = componentFiles(join(root, "src", "components"))
    expect(files.length).toBeGreaterThan(40)

    const unreachable = files
      .map((file) => ({
        file,
        names: declaredIn(file).filter((name) => !published.has(originOf(file, name))),
      }))
      .filter(({ names }) => names.length > 0)
      .map(({ file, names }) => `${shown(file)}: ${names.join(", ")}`)

    expect(
      unreachable,
      "re-export it from the barrel its neighbours go through, renaming it there if the bare name says nothing beside eighty others",
    ).toEqual([])
  })
})
