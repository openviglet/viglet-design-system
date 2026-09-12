#!/usr/bin/env node
// VDS136 — write dist/catalogue.json: every exported component, what it is for,
// its props and the contract sections that govern it.
//
// dist/exports.json says a name exists. An agent choosing between two
// components needs to know what each is for and what it takes, and until now it
// read the type declarations to find out, which costs a session far more than
// one lookup would. This is the lookup's data, and `viglet-ds-mcp` serves it.
//
// Generated from the built declarations and the two contract documents, never
// written by hand: a hand-kept catalogue is the one that falls behind the barrel.
// So a component's purpose is its own doc comment, and one with none has an
// empty summary rather than an invented one.

import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve, sep } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const dist = join(repoRoot, "dist")
const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"))

/** Where a prop's declaration has to live to be the component's own, not React's. */
const OWN = dist + sep

const SUMMARY_CHARS = 240
const DESCRIPTION_CHARS = 1600
const TYPE_CHARS = 160

// The root entry first, so a name exported twice is recorded under the import a
// product would write, which is the rule check-duplicates follows.
const entries = Object.entries(pkg.exports ?? {})
  .filter(([, value]) => typeof value === "object" && typeof value?.types === "string")
  .map(([subpath, value]) => [subpath, join(repoRoot, value.types.slice(2))])
  .sort(([a], [b]) => (a === "." ? -1 : b === "." ? 1 : a.localeCompare(b)))

const program = ts.createProgram(
  entries.map(([, file]) => file),
  {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    skipLibCheck: true,
    noEmit: true,
  },
)
const checker = program.getTypeChecker()

const clip = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text)
const flat = (text) => text.replace(/\s+/g, " ").trim()

/**
 * A doc comment as a reader outside this repository can use it. The roadmap id a
 * comment opens with ("VDS131 — ") is bookkeeping a consumer has no access to,
 * and `{@link X}` is markup for an editor, not for a catalogue answer.
 */
const readable = (text) =>
  text
    // This roadmap's ids and the ones components carried in from the products
    // they grew in ("T572"), neither of which a consumer can look up.
    .replace(/^\s*[A-Z]{1,3}\d{2,}\s*[—–-]\s*/, "")
    .replace(/\s*\((?:[A-Z]{1,3}\d{2,}(?:,\s*)?)+\)/g, "")
    .replace(/\{@link\s+([^}\s|]+)[^}]*\}/g, "$1")
    .trim()

/** The first sentence of a doc comment, which is what a list of candidates shows. */
function firstSentence(text) {
  const paragraph = flat(text.split(/\n\s*\n/)[0] ?? "")
  const end = paragraph.search(/[.!?](\s|$)/)
  return clip(end === -1 ? paragraph : paragraph.slice(0, end + 1), SUMMARY_CHARS)
}

function tag(symbol, name) {
  const found = symbol.getJsDocTags(checker).find((t) => t.name === name)
  return found ? flat(readable(ts.displayPartsToString(found.text ?? []))) || "yes" : null
}

/**
 * The sections of a contract document that name a component in backticks, as
 * "BENTO-AUTHORING §1 The shell, and the page's regions". Backticks only: a
 * sentence using "panel" as a word is not a rule about `BentoPanel`.
 */
function sectionsNaming(file, label) {
  const found = new Map()
  let heading = null
  for (const line of readFileSync(join(repoRoot, "docs", file), "utf8").split("\n")) {
    const match = /^##\s+(.+)$/.exec(line)
    if (match) {
      heading = `${label} ${match[1].replace(/^(\d+)\.\s*/, "§$1 ")}`
      continue
    }
    if (!heading) continue
    for (const [, name] of line.matchAll(/`([A-Z][A-Za-z0-9]*)`/g)) {
      if (!found.has(name)) found.set(name, new Set())
      found.get(name).add(heading)
    }
  }
  return found
}

const RULES = [sectionsNaming("BENTO-AUTHORING.md", "BENTO-AUTHORING"), sectionsNaming("BENTO-BOUNDARY.md", "BENTO-BOUNDARY")]

function rulesFor(name) {
  return RULES.flatMap((map) => [...(map.get(name) ?? [])])
}

/** A component is a PascalCase value React can render: callable, constructible, or an exotic component. */
function componentType(symbol) {
  const name = symbol.getName()
  if (!/^[A-Z][A-Za-z0-9]*$/.test(name) || /^[A-Z0-9_]+$/.test(name)) return null
  const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol
  if (!(target.flags & (ts.SymbolFlags.Function | ts.SymbolFlags.Variable | ts.SymbolFlags.Class))) return null
  const declaration = target.valueDeclaration ?? target.declarations?.[0]
  if (!declaration) return null
  const type = checker.getTypeOfSymbolAtLocation(target, declaration)
  const signature = type.getCallSignatures()[0] ?? type.getConstructSignatures()[0]
  if (signature) return { target, declaration, signature }
  if (/ExoticComponent|ComponentType|FC</.test(checker.typeToString(type))) {
    return { target, declaration, signature: null }
  }
  return { excluded: checker.typeToString(type) }
}

function propsOf(found) {
  const parameter = found.signature?.getParameters()[0]
  if (!parameter) return { props: [], inherited: 0 }
  const parameterType = checker.getTypeOfSymbolAtLocation(parameter, found.declaration)
  const props = []
  let inherited = 0
  for (const prop of checker.getPropertiesOfType(parameterType)) {
    const declaration = prop.valueDeclaration ?? prop.declarations?.[0]
    // A prop declared by React or the DOM is the element's, and the component
    // passes it through: counted, not listed, or a button lists two hundred.
    if (!declaration || !resolve(declaration.getSourceFile().fileName).startsWith(OWN)) {
      inherited++
      continue
    }
    props.push({
      name: prop.getName(),
      type: clip(flat(checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, declaration))), TYPE_CHARS),
      optional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
      summary: firstSentence(readable(ts.displayPartsToString(prop.getDocumentationComment(checker)))),
    })
  }
  props.sort((a, b) => Number(a.optional) - Number(b.optional) || a.name.localeCompare(b.name))
  return { props, inherited }
}

const components = new Map()
const excluded = new Map()

for (const [subpath, file] of entries) {
  const source = program.getSourceFile(file)
  const moduleSymbol = source && checker.getSymbolAtLocation(source)
  if (!moduleSymbol) {
    console.error(`emit-catalogue: no declarations for "${subpath}" at ${file}`)
    process.exit(1)
  }
  const specifier = subpath === "." ? pkg.name : `${pkg.name}/${subpath.slice(2)}`

  for (const symbol of checker.getExportsOfModule(moduleSymbol)) {
    const name = symbol.getName()
    if (components.has(name)) continue
    const found = componentType(symbol)
    if (!found) continue
    if (found.excluded) {
      if (!excluded.has(name)) excluded.set(name, { name, specifier, reason: `not renderable: ${clip(found.excluded, 80)}` })
      continue
    }
    excluded.delete(name)

    const doc = readable(ts.displayPartsToString(found.target.getDocumentationComment(checker)))
    const { props, inherited } = propsOf(found)
    components.set(name, {
      name,
      specifier,
      summary: firstSentence(doc),
      description: clip(doc, DESCRIPTION_CHARS),
      deprecated: tag(found.target, "deprecated"),
      example: tag(found.target, "example"),
      props,
      inheritedProps: inherited,
      rules: rulesFor(name),
    })
  }
}

const catalogue = {
  name: pkg.name,
  version: pkg.version,
  generatedBy: "scripts/emit-catalogue.mjs",
  components: [...components.values()].sort((a, b) => a.name.localeCompare(b.name)),
  excluded: [...excluded.values()].sort((a, b) => a.name.localeCompare(b.name)),
}

writeFileSync(join(dist, "catalogue.json"), `${JSON.stringify(catalogue, null, 2)}\n`)
const described = catalogue.components.filter((c) => c.summary).length
console.log(
  `emit-catalogue: ${catalogue.components.length} component(s), ${described} with a doc comment, ` +
    `${catalogue.excluded.length} PascalCase value(s) set aside -> dist/catalogue.json`,
)
