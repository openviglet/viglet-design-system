#!/usr/bin/env node
/**
 * VDS158 — the README's inventory, held to the surface it describes.
 *
 * `## What's Included` is where a product author looks first, and every list in
 * it was typed by hand. One of them drifted exactly as that invites: the App
 * Components list named ten while the root entry shipped seven more beside
 * them, and the compounds under `src/components/login` and
 * `src/components/startup-first` were absent too. The UI Primitives list was
 * accurate, which is the part worth noticing — nothing was keeping it that way.
 *
 * So the lists are read and compared against `dist/exports.json`, the surface
 * the build already emits per entry, in both directions:
 *
 *   shipped and unlisted   a name the root entry exports that no list names —
 *                          the front door reading as the whole surface while
 *                          being a subset
 *   listed and unshipped   a name no entry exports any more, which is what a
 *                          removal like VDS147 leaves behind
 *
 * **Families, not names.** A list names `Accordion`, not its four parts, so a
 * listed name covers every export that continues it in PascalCase:
 * `Accordion` covers `AccordionItem`, and `Toast` does not cover `Toaster`,
 * because a compound's sub-part always resumes on a capital. That is what makes
 * equality the rule here rather than a cap on omissions — a cap would say how
 * many names are missing without saying which, and would quietly free budget
 * every time a component was removed.
 *
 * The lists are the inventory, so this asserts the parse found one. A reader
 * that silently returns nothing agrees with every README, including an empty
 * one, and that is the failure this file would be least likely to notice about
 * itself.
 */

import { readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/** Below either of these, the parse failed rather than the README being small. */
const FEWEST_LISTED = 40
const FEWEST_EXPORTED = 100

const COMPONENT = /^[A-Z][A-Za-z0-9]*$/
const IDENTIFIER = /^[a-zA-Z][A-Za-z0-9]*$/

/**
 * One comma-separated item as the names it carries.
 *
 * A parenthetical is a gloss and not a name — `Toaster (sonner)` names one
 * export and says which library is under it, `VigletAssistant ([the dock](#…))`
 * names one and links to its section — so everything from the first `(` is cut.
 * A slash separates a pair that belongs together, which is how the contexts list
 * writes a provider beside its hook.
 */
export function namesIn(item) {
  const gloss = item.indexOf("(")
  const named = gloss === -1 ? item : item.slice(0, gloss)
  return named
    .split("/")
    .map((part) => part.replaceAll("`", "").trim())
    .filter((part) => IDENTIFIER.test(part))
}

/**
 * Whether a line is a list of names rather than a sentence that happens to hold
 * commas. Every item has to carry a name, which is what keeps a prose paragraph
 * under one of these headings — or the line recording what the console era took
 * with it — from being read as an inventory.
 */
function listLine(line) {
  const items = line.split(",")
  if (items.length < 2) return null
  const names = items.map(namesIn)
  if (names.some((found) => found.length === 0)) return null
  return names.flat()
}

/**
 * Each `###` subsection of `## What's Included`, as the names its list carries
 * and the count its heading claims. The first list line is the inventory; the
 * paragraphs under it explain individual entries and name them again.
 */
export function inventory(readme) {
  const included = readme.split("## What's Included")[1]
  if (included === undefined) return []
  const body = included.split(/^## /m)[0]

  const sections = []
  for (const chunk of body.split(/^### /m).slice(1)) {
    const [heading, ...rest] = chunk.split("\n")
    const claimed = /\((\d+)\s+components?\)/.exec(heading)
    for (const line of rest) {
      const names = listLine(line.trim())
      if (!names) continue
      sections.push({
        heading: heading.trim(),
        names,
        claimed: claimed ? Number(claimed[1]) : null,
      })
      break
    }
  }
  return sections
}

/** Whether `part` continues `family` on a capital: `Accordion` → `AccordionItem`. */
const partOf = (part, family) =>
  part.length > family.length && part.startsWith(family) && /[A-Z]/.test(part[family.length])

/**
 * The module a listed name stands for, or null where it stands for nothing.
 *
 * VDS160 — a name alone cannot say whether two exports are one component or
 * two, and reading them by prefix let a whole component hide behind a listed
 * one: `Button` covering a `ButtonGroup` nobody wrote down is the omission this
 * gate exists to catch. Being declared together is what makes a compound a
 * compound, and `declaredIn` carries that from the build.
 *
 * A name is usually its own export and answers with its own module. `Resizable`
 * is the other case — a family with three parts and no export of its own — and
 * it stands for their module only where they all agree on one. Parts that
 * disagree are two families sharing a prefix, which is the thing being caught.
 */
export function moduleOf(name, declaredIn) {
  if (declaredIn[name]) return declaredIn[name]
  const parts = Object.keys(declaredIn).filter((value) => partOf(value, name))
  if (parts.length === 0) return null
  const [first] = parts
  return parts.every((value) => declaredIn[value] === declaredIn[first]) ? declaredIn[first] : null
}

/** Whether some listed name is this export's own name, or the family it was declared in. */
export function covered(name, listed, declaredIn) {
  if (listed.has(name)) return true
  const module = declaredIn[name]
  if (!module) return false
  return [...listed].some((family) => partOf(name, family) && moduleOf(family, declaredIn) === module)
}

/**
 * Whether a listed name still names something — `covered` read the other way.
 * A heading standing over a family that is gone is what a removal like VDS147
 * leaves behind, and it is the one direction a name with no module can fail.
 */
export function ships(name, declaredIn, exported) {
  return exported.has(name) || moduleOf(name, declaredIn) !== null
}

/**
 * What the README and the surface disagree about. `entry` is the one the lists
 * describe; a listed name is shipped if any entry exports it, since the README
 * says where a subpath's own names come from in its own prose.
 */
export function findings(sections, exports, entry = ".") {
  const problems = []
  const listed = new Set(sections.flatMap((section) => section.names).filter((name) => COMPONENT.test(name)))
  const shipped = new Set(Object.values(exports.entries).flatMap((one) => one.values))
  const described = (exports.entries[entry]?.values ?? []).filter((name) => COMPONENT.test(name))
  // Every entry's, so a name listed here and declared under another subpath is
  // still read as the family it belongs to rather than as a stray prefix.
  const declaredIn = Object.assign({}, ...Object.values(exports.entries).map((one) => one.declaredIn ?? {}))

  if (listed.size < FEWEST_LISTED) {
    problems.push(`only ${listed.size} name(s) were read out of the README's lists, so the reader is broken, not the README`)
  }
  if (described.length < FEWEST_EXPORTED) {
    problems.push(`only ${described.length} component(s) were read out of ${entry}, so exports.json was not the surface`)
  }
  if (problems.length > 0) return problems

  // One direction is an inventory, the other is not. Every component the entry
  // exports has to be named, because that list is what a product author reads as
  // the whole surface. The hooks and the contexts are a chosen few out of far
  // more camelCase exports than anyone would want listed, so they are held only
  // to existing — which is the half a removal breaks.
  for (const name of described) {
    if (!covered(name, listed, declaredIn)) {
      problems.push(`${name} is exported from "${entry}" and no list names it`)
    }
  }
  for (const section of sections) {
    for (const name of section.names) {
      if (!ships(name, declaredIn, shipped)) {
        problems.push(`${section.heading} names ${name}, which no entry exports`)
      }
    }
    if (section.claimed !== null && section.claimed !== section.names.length) {
      problems.push(`${section.heading} lists ${section.names.length} name(s), and its heading claims ${section.claimed}`)
    }
  }
  return problems
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const readme = readFileSync(join(root, "README.md"), "utf8")
  const exports = JSON.parse(readFileSync(join(root, "dist", "exports.json"), "utf8"))
  const sections = inventory(readme)
  const problems = findings(sections, exports)

  if (problems.length > 0) {
    console.error(`\ncheck-readme: ${problems.length} problem(s)\n`)
    for (const problem of problems) console.error(`  - ${problem}`)
    console.error("")
    process.exit(1)
  }

  const listed = new Set(sections.flatMap((section) => section.names))
  console.log(
    `check-readme: ${sections.length} list(s) naming ${listed.size} component(s), ` +
      `every name in the root entry accounted for — clean.`,
  )
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
