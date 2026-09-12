import { existsSync, readFileSync, readdirSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

/**
 * VDS116 — a published component that no story renders.
 *
 * VDS6 wired the axe addon so every story is checked for accessibility, which
 * makes the catalogue the only accessibility gate this suite runs. A component
 * with no story is therefore outside it, and absent from the catalogue that
 * exists so a product author finds a component instead of rebuilding it — which
 * is what `BentoPanel`'s own doc comment says it was written to stop. Eight
 * standalone components were in that position, and the first story written for
 * one of them found two nested `main` landmarks on every console entity page
 * (VDS125).
 *
 * **Reached, not named.** Most exported components are compound sub-parts or
 * pieces a parent assembles: a `SidebarMenuSubItem` is exercised by the
 * sidebar's story, and `NavMain` by `InternalSidebar`'s, whether or not either
 * has one of its own. Axe checks what a story *renders*, so the question is
 * reachability — which module graph a story pulls in — and not which names its
 * source happens to spell.
 *
 * A barrel is deliberately not a way in: importing one is no evidence that any
 * particular member renders. No story here imports one, and the check would stop
 * quietly being about rendering if one did, so that is asserted rather than
 * assumed.
 */

const root = resolve(import.meta.dirname, "..")
const src = join(root, "src")

function parse(file: string): ts.SourceFile {
  return ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
}

const isComponentName = (name: string) => /^[A-Z][A-Za-z0-9]*$/.test(name)

/**
 * The components a file exports — PascalCase *values* only.
 *
 * A type carries no runtime and renders nothing, so `BentoPanelProps` is not a
 * thing a story could show; the `type` keyword in an export list and the
 * interface and alias declarations are what separate the two.
 */
export function componentsIn(file: string): string[] {
  const found: string[] = []

  for (const statement of parse(file).statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly || statement.moduleSpecifier) continue
      if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue
      for (const element of statement.exportClause.elements) {
        if (element.isTypeOnly) continue
        if (isComponentName(element.name.text)) found.push(element.name.text)
      }
      continue
    }

    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : []
    if (!modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && isComponentName(declaration.name.text)) {
          found.push(declaration.name.text)
        }
      }
    } else if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
      if (statement.name && isComponentName(statement.name.text)) found.push(statement.name.text)
    }
  }

  return found
}

const isBarrel = (file: string) => /[/\\]index\.tsx?$/.test(file)

/** A module specifier as a file in this tree — relative or `@/`-aliased. */
function moduleFile(from: string, specifier: string): string | undefined {
  let base: string
  if (specifier.startsWith(".")) base = resolve(dirname(from), specifier)
  else if (specifier.startsWith("@/")) base = join(src, specifier.slice(2))
  else return undefined

  return [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
    (candidate) => existsSync(candidate),
  )
}

/** What a file imports, as files in this tree. */
function importsOf(file: string): string[] {
  const found: string[] = []
  for (const statement of parse(file).statements) {
    const specifier = ts.isImportDeclaration(statement)
      ? statement.moduleSpecifier
      : ts.isExportDeclaration(statement)
        ? statement.moduleSpecifier
        : undefined
    if (!specifier || !ts.isStringLiteral(specifier)) continue
    if (ts.isImportDeclaration(statement) && statement.importClause?.isTypeOnly) continue
    const target = moduleFile(file, specifier.text)
    if (target) found.push(target)
  }
  return found
}

/** Every module a story pulls in, and so every component axe gets to see. */
function reachableFrom(entries: string[]): Set<string> {
  const seen = new Set<string>()
  const queue = [...entries]
  while (queue.length > 0) {
    const file = queue.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    for (const next of importsOf(file)) {
      // See the header: a barrel says nothing about what renders.
      if (!isBarrel(next)) queue.push(next)
    }
  }
  return seen
}

function walk(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === "__screenshots__") continue
      walk(full, found)
    } else if (entry.name.endsWith(".tsx")) {
      found.push(full)
    }
  }
  return found
}

const everything = walk(src)
const storyFiles = everything.filter((f) => f.endsWith(".stories.tsx"))
const componentFiles = everything.filter(
  (f) => !/\.(test|spec|stories)\.tsx$/.test(f) && !/[/\\]index\.tsx$/.test(f),
)

const rendered = reachableFrom(storyFiles)

const shown = (file: string) => relative(root, file).replaceAll("\\", "/")

describe("every component file reaches the catalogue", () => {
  it("follows a story into what it renders, and no story hides behind a barrel", () => {
    expect(storyFiles.length).toBeGreaterThan(60)
    expect(componentFiles.length).toBeGreaterThan(80)

    // Transitive, and the reason this follows imports rather than names: no
    // story file is called `bento-hero.stories.tsx`, and `bento-shell` renders
    // the hero, so axe reaches it through a parent it never spells.
    const hero = join(src, "bento/bento-hero.tsx")
    expect(existsSync(join(src, "bento/bento-hero.stories.tsx"))).toBe(false)
    expect(rendered.has(hero)).toBe(true)

    // A barrel import in a story would make this stop being about rendering.
    const viaBarrel = storyFiles.flatMap((story) => importsOf(story)).filter(isBarrel)
    expect(viaBarrel.map(shown), "a story imported a barrel — see the header").toEqual([])
  })

  it("names any component file no story reaches", () => {
    const uncovered = componentFiles
      .filter((file) => componentsIn(file).length > 0 && !rendered.has(file))
      .map((file) => `${shown(file)}: ${componentsIn(file).join(", ")}`)

    expect(
      uncovered,
      "give it a story — the catalogue is the only accessibility gate this suite runs, and a component outside it has never been checked",
    ).toEqual([])
  })
})
