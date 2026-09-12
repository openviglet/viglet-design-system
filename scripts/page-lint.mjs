#!/usr/bin/env node
// VDS132 — fail a consumer's lint on the two rules BENTO-AUTHORING calls easy
// to get wrong, and name the file and line of each.
//
// Run it from a product checkout, beside viglet-ds-check-duplicates:
//
//   viglet-ds-page-lint                       # scan ./src
//   viglet-ds-page-lint src app               # scan these directories
//   viglet-ds-page-lint --json                # machine-readable findings
//   viglet-ds-page-lint --warn                # report, but exit 0
//   viglet-ds-page-lint --page-pattern <re>   # which files are routed pages
//
// The rules:
//
//   page.column    A routed page's outermost element sets a max width, a gutter
//                  or a vertical rhythm. BentoShell owns all three and offers the
//                  other widths by name, so a page that sets its own disagrees
//                  with the next page, and the defect exists only between screens.
//   primary.direct A stylesheet or a style object sets --vg-primary or
//                  --vg-primary-foreground. One value there wins on both grounds,
//                  so the dark ground takes the light colour; the four
//                  --vg-primary-*-base inputs are read per ground.
//
// Both were prose in the vendored skill, and the bins beside this one read
// exports, imports and vendored files, never a consumer's pages or stylesheets.
//
// A page is a file whose name matches `--page-pattern` (default `.page.tsx` or
// `.page.jsx`), and its outermost element is what its default export returns:
// each branch of a conditional, and each child of a fragment. A width set deeper
// inside the page is not this rule's business. A class counts when it is written
// as a string, in a template, or as a string inside a call such as `cn(...)`.
//
// Some pages are deliberately their own, a print view or a kiosk. Keep one by
// writing, anywhere in the file:
//
//   // viglet-ds-allow-page-column -- a kiosk with no shell
//   /* viglet-ds-allow-primary -- the theme editor previews a raw value */
//
// The reason is required. An exemption with none is reported as the finding it
// was meant to excuse.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { join, relative, resolve } from "node:path"

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs", ".cts", ".cjs"])
const STYLE_EXTENSIONS = new Set([".css", ".scss"])
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "out", "coverage", ".next", "storybook-static"])

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const warnOnly = args.includes("--warn")
// The value after a flag is not a root. Skipped by index and only when the flag
// is there: VDS78 is what `indexOf(...) + 1` does when it is not.
const patternFlag = args.indexOf("--page-pattern")
const patternValueAt = patternFlag === -1 ? -1 : patternFlag + 1
const pagePattern = new RegExp(patternFlag === -1 ? String.raw`\.page\.[jt]sx$` : (args[patternValueAt] ?? ""))
const roots = args.filter((a, i) => !a.startsWith("--") && i !== patternValueAt)

/** The consumer's TypeScript, or this package's own where it is a checkout. */
function loadTypeScript() {
  for (const from of [join(process.cwd(), "package.json"), import.meta.url]) {
    try {
      return createRequire(from)("typescript")
    } catch {
      /* try the next */
    }
  }
  console.error(
    "page-lint: reads pages with the TypeScript compiler, and none is installed here.\n" +
      "Add typescript to this repository's devDependencies and re-run.",
  )
  process.exit(1)
}

const scanRoots = (roots.length ? roots : ["src"]).map((r) => resolve(r))
const missing = scanRoots.filter((r) => !existsSync(r) || !statSync(r).isDirectory())
if (missing.length > 0) {
  console.error(
    `page-lint: not a directory: ${missing.map((r) => relative(process.cwd(), r) || ".").join(", ")}\n` +
      "Pass the source directories explicitly: viglet-ds-page-lint <dir> [dir]",
  )
  process.exit(1)
}

function collect(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) collect(full, files)
    } else {
      files.push(full)
    }
  }
  return files
}

const extensionOf = (file) => file.slice(file.lastIndexOf("."))
const lineOf = (text, index) => text.slice(0, index).split("\n").length
const shown = (file) => relative(process.cwd(), file).replaceAll("\\", "/")

/** Whether a pragma is present, and whether it carries a reason. */
function pragma(source, name) {
  const found = source.match(new RegExp(String.raw`viglet-ds-allow-${name}\b(.*)`))
  if (!found) return "absent"
  return /^\s*--\s*\S/.test(found[1]) ? "reasoned" : "unreasoned"
}

// ---------------------------------------------------------------------------
// page.column

const WIDTH = /^(?:max-w-(?!none$|full$).+|container)$/
const GUTTER = /^(?:p|px|pl|pr|ps|pe)-(?!0$).+$/
const RHYTHM = /^(?:py|pt|pb|my|mt|mb)-(?!0$).+$/

/** `md:max-w-7xl!` -> `max-w-7xl`: variants and the important marker say where, not what. */
function utility(token) {
  return token.split(":").pop().replace(/^!/, "").replace(/!$/, "")
}

function layoutClasses(classNames) {
  return classNames
    .flatMap((text) => text.split(/\s+/))
    .filter(Boolean)
    .filter((token) => {
      const name = utility(token)
      return WIDTH.test(name) || GUTTER.test(name) || RHYTHM.test(name)
    })
}

function pageFindings(ts, file, source) {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

  /** Every string a className expression can produce, conditions and calls included. */
  function strings(node, found = []) {
    if (!node) return found
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      found.push(node.text)
    } else if (ts.isTemplateExpression(node)) {
      found.push(node.head.text, ...node.templateSpans.map((span) => span.literal.text))
      for (const span of node.templateSpans) strings(span.expression, found)
    } else {
      // forEachChild stops at the first callback that returns a value, so this
      // one returns nothing: `cn("grid", wide && "max-w-6xl")` has two strings.
      ts.forEachChild(node, (child) => {
        strings(child, found)
      })
    }
    return found
  }

  function classNameOf(opening) {
    for (const attribute of opening.attributes.properties) {
      if (!ts.isJsxAttribute(attribute) || attribute.name.getText(sf) !== "className") continue
      return strings(attribute.initializer)
    }
    return []
  }

  /** The outermost elements an expression renders. */
  function outermost(node, found = []) {
    if (!node) return found
    if (ts.isParenthesizedExpression(node)) return outermost(node.expression, found)
    if (ts.isConditionalExpression(node)) {
      outermost(node.whenTrue, found)
      return outermost(node.whenFalse, found)
    }
    if (ts.isBinaryExpression(node)) return outermost(node.right, found)
    if (ts.isJsxElement(node)) found.push(node.openingElement)
    else if (ts.isJsxSelfClosingElement(node)) found.push(node)
    else if (ts.isJsxFragment(node)) {
      for (const child of node.children) outermost(child, found)
    }
    return found
  }

  /** What a function returns, without descending into the functions it declares. */
  function returned(fn) {
    if (!fn.body) return []
    if (!ts.isBlock(fn.body)) return [fn.body]
    const found = []
    const visit = (node) => {
      if (ts.isFunctionLike(node)) return
      if (ts.isReturnStatement(node) && node.expression) found.push(node.expression)
      ts.forEachChild(node, visit)
    }
    ts.forEachChild(fn.body, visit)
    return found
  }

  /** A function, through `memo(...)`, `forwardRef(...)` or an identifier declared here. */
  function asFunction(node) {
    if (!node) return null
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) return node
    if (ts.isParenthesizedExpression(node)) return asFunction(node.expression)
    if (ts.isCallExpression(node)) return asFunction(node.arguments[0])
    if (ts.isIdentifier(node)) {
      for (const statement of sf.statements) {
        if (ts.isFunctionDeclaration(statement) && statement.name?.text === node.text) return statement
        if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === node.text) {
              return asFunction(declaration.initializer)
            }
          }
        }
      }
    }
    return null
  }

  let page = null
  for (const statement of sf.statements) {
    if (ts.isExportAssignment(statement)) page = asFunction(statement.expression)
    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : []
    if (
      ts.isFunctionDeclaration(statement) &&
      modifiers.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) &&
      modifiers.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)
    ) {
      page = statement
    }
  }
  if (!page) return []

  const findings = []
  for (const expression of returned(page)) {
    for (const opening of outermost(expression)) {
      const offending = layoutClasses(classNameOf(opening))
      if (offending.length === 0) continue
      findings.push({
        file: shown(file),
        line: sf.getLineAndCharacterOfPosition(opening.getStart(sf)).line + 1,
        rule: "page.column",
        detail: `the page's outermost element sets ${[...new Set(offending)].join(" ")}`,
        fix: 'remove them: BentoShell sets the column, and column="narrow" or "wide" names the other widths',
      })
    }
  }
  return findings
}

// ---------------------------------------------------------------------------
// primary.direct

// A declaration or a write, never a read: `var(--vg-primary)` has no colon after
// the name, `--vg-primary-base:` has more name before it, and
// `getPropertyValue("--vg-primary")` closes a call where `setProperty` takes a
// second argument.
const DECLARED = /--vg-primary(?:-foreground)?\s*:/g
const KEYED = /["'`]--vg-primary(?:-foreground)?["'`]\s*[:,]/g

// Blanked rather than removed, so a finding's line survives. In a script only a
// comment that opens its line: `//` also sits inside a URL, and a glob such as
// "src/**" opens a block anywhere else.
const blank = (text) => text.replace(/[^\n]/g, " ")
const withoutComments = (source, isStyle) =>
  isStyle
    ? source.replace(/\/\*[\s\S]*?\*\//g, blank)
    : source.replace(/^[ \t]*\/\*[\s\S]*?\*\//gm, blank).replace(/^[ \t]*\/\/.*$/gm, blank)

function primaryFindings(file, source, isStyle) {
  const text = withoutComments(source, isStyle)
  const findings = []
  const seen = new Set()
  for (const pattern of isStyle ? [DECLARED] : [DECLARED, KEYED]) {
    for (const match of text.matchAll(pattern)) {
      const line = lineOf(text, match.index)
      const name = match[0].replace(/["'`:,\s]/g, "")
      if (seen.has(`${line}:${name}`)) continue
      seen.add(`${line}:${name}`)
      findings.push({
        file: shown(file),
        line,
        rule: "primary.direct",
        detail: `sets ${name}`,
        fix: "claim it through the --vg-primary-base and --vg-primary-foreground-base inputs, light and -dark, at :root",
      })
    }
  }
  return findings.sort((a, b) => a.line - b.line)
}

// ---------------------------------------------------------------------------

let ts = null
const findings = []
let scanned = 0
let pages = 0

for (const root of scanRoots) {
  for (const file of collect(root)) {
    const extension = extensionOf(file)
    const isStyle = STYLE_EXTENSIONS.has(extension)
    const isSource = SOURCE_EXTENSIONS.has(extension)
    if (!isStyle && !isSource) continue
    if (/\.(test|spec|stories)\./.test(file)) continue

    const source = readFileSync(file, "utf8")
    scanned++

    const fileFindings = []
    if (isSource && pagePattern.test(file.replaceAll("\\", "/"))) {
      pages++
      ts ??= loadTypeScript()
      fileFindings.push(...pageFindings(ts, file, source))
    }
    fileFindings.push(...primaryFindings(file, source, isStyle))

    const allowed = {
      "page.column": pragma(source, "page-column"),
      "primary.direct": pragma(source, "primary"),
    }
    for (const finding of fileFindings) {
      const state = allowed[finding.rule]
      if (state === "reasoned") continue
      if (state === "unreasoned") finding.detail += " (an exemption here gives no reason, so it does not apply)"
      findings.push(finding)
    }
  }
}

if (scanned === 0) {
  console.error(
    `page-lint: no source file under ${scanRoots.map((r) => shown(r) || ".").join(", ")}, so this would pass vacuously.`,
  )
  process.exit(1)
}

if (asJson) {
  console.log(JSON.stringify({ scanned, pages, findings }, null, 2))
} else if (findings.length === 0) {
  console.log(`page-lint: ${scanned} file(s) scanned, ${pages} of them pages — no page sets its own column, nothing sets --vg-primary.`)
} else {
  console.error(`\npage-lint: ${findings.length} finding(s)\n`)
  for (const finding of findings) {
    console.error(`  ${finding.file}:${finding.line}  ${finding.rule}  ${finding.detail}`)
    console.error(`      ${finding.fix}\n`)
  }
}

process.exit(findings.length > 0 && !warnOnly ? 1 : 0)
