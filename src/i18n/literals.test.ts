import { readFileSync, readdirSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import ts from "typescript"
import { describe, expect, it } from "vitest"

/**
 * VDS93 — a string a shipped component draws or announces is a string the
 * bundles hold.
 *
 * VDS51 holds the other direction: a key this package asks for is a key it
 * ships. Nothing held a word typed straight into the JSX, and twenty-one had
 * been, most of them announced unseen: the dialog's and the sheet's `Close`, the
 * pagination's `Go to previous page`, the sidebar's `Toggle Sidebar`, the wizard's
 * `Step 1 of 3`. A Portuguese product read them in English, and only the reader
 * who could not see the screen heard it.
 *
 * Read with the compiler rather than a pattern: text alone on its line between
 * two tags, a literal in one branch of a ternary, and a template literal are all
 * JSX a regex misses — and all three were among what this found.
 */

const srcDir = resolve(import.meta.dirname, "..")

/** The attributes a person reads or hears. `label` is the prop this package's own components take for one. */
const SPOKEN = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "aria-roledescription",
  "aria-valuetext",
  "label",
  "placeholder",
  "title",
])

/** A child of these is code, not a word: `badge-colorful` writes a stylesheet. */
const CODE = new Set(["style", "script"])

/** An entity is punctuation — the grid's `&lt;` has letters and says none. */
const hasWord = (text: string) => /\p{L}/u.test(text.replace(/&[a-z]+;|&#\d+;/gi, ""))

/**
 * The literals an expression renders: itself, either branch, either side of a
 * fallback. A call is not followed, and that is the point — the fix is
 * `t("key", { defaultValue: "Close" })`, whose literal is the English a
 * consumer without i18n still reads.
 */
function rendered(expr: ts.Expression | undefined): string[] {
  if (!expr) return []
  if (ts.isParenthesizedExpression(expr)) return rendered(expr.expression)
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return [expr.text]
  if (ts.isTemplateExpression(expr)) return [expr.head.text, ...expr.templateSpans.map((span) => span.literal.text)]
  if (ts.isConditionalExpression(expr)) return [...rendered(expr.whenTrue), ...rendered(expr.whenFalse)]
  if (ts.isBinaryExpression(expr)) {
    switch (expr.operatorToken.kind) {
      case ts.SyntaxKind.AmpersandAmpersandToken:
        return rendered(expr.right)
      case ts.SyntaxKind.BarBarToken:
      case ts.SyntaxKind.QuestionQuestionToken:
      case ts.SyntaxKind.PlusToken:
        return [...rendered(expr.left), ...rendered(expr.right)]
    }
  }
  return []
}

/** A child of a JSX element or fragment — what renders as content, unless the element holds code. */
function isContent(node: ts.Node): boolean {
  const parent = node.parent
  if (ts.isJsxFragment(parent)) return true
  return ts.isJsxElement(parent) && !CODE.has(parent.openingElement.tagName.getText())
}

/** Every word `source` draws or announces outside the bundles, as `line: "text"`. */
function literalsIn(fileName: string, source: string): string[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: string[] = []
  const note = (node: ts.Node, text: string) => {
    const { line } = file.getLineAndCharacterOfPosition(node.getStart())
    found.push(`${line + 1}: ${JSON.stringify(text)}`)
  }

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      if (isContent(node) && hasWord(node.text)) note(node, node.text.trim())
    } else if (ts.isJsxExpression(node)) {
      if (isContent(node)) for (const text of rendered(node.expression).filter(hasWord)) note(node, text.trim())
    } else if (ts.isJsxAttribute(node) && SPOKEN.has(node.name.getText()) && node.initializer) {
      const init = node.initializer
      const said = ts.isStringLiteral(init) ? [init.text] : ts.isJsxExpression(init) ? rendered(init.expression) : []
      for (const text of said.filter(hasWord)) note(node, `${node.name.getText()}=${text.trim()}`)
    }
    // On into attributes too: `icon={<X aria-label="…" />}` is JSX an
    // attribute holds, and its initializer is never content, so nothing is
    // counted twice.
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

/** Shipped components — a story or a test typing English proves nothing. */
function components(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) components(full, found)
    else if (entry.name.endsWith(".tsx") && !/\.(test|stories)\./.test(entry.name)) found.push(full)
  }
  return found
}

const shipped = components(srcDir)

describe("a shipped component says nothing the bundles do not hold", () => {
  it("reads every form a literal took here, and passes the fix", () => {
    // Non-vacuous: each of these was in a shipped component, and the sweep below
    // asserts an empty list — which a reader that found nothing also produces.
    expect(shipped.length).toBeGreaterThan(80)
    const specimen = (jsx: string) => literalsIn("specimen.tsx", `const x = (c: boolean) => (${jsx})`)

    expect(specimen(`<span className="sr-only">Close</span>`)).toEqual([`1: "Close"`])
    expect(specimen(`<nav aria-label="breadcrumb" />`)).toEqual([`1: "aria-label=breadcrumb"`])
    expect(specimen(`<div title={c ? "Open navigation" : undefined} />`)).toEqual([`1: "title=Open navigation"`])
    expect(specimen("<div aria-label={`Step ${1} of ${3}`} />")).toEqual([`1: "aria-label=Step"`, `1: "aria-label=of"`])
    // Named at the line the words are on, not the tag's.
    expect(specimen(`<p>\n  Displays the mobile sidebar.\n</p>`)).toEqual([`2: "Displays the mobile sidebar."`])
    expect(specimen(`<b>{c && "Idle"}</b>`)).toEqual([`1: "Idle"`])

    expect(specimen(`<span className="sr-only">{t("dialog.close", { defaultValue: "Close" })}</span>`)).toEqual([])
    expect(specimen(`<span>&lt;</span>`)).toEqual([])
    expect(specimen(`<span>{"—"} · 3</span>`)).toEqual([])
    expect(specimen("<style>{`.dark [title=\"x\"] { color: red }`}</style>")).toEqual([])
  })

  it.each(shipped.map((file) => [relative(srcDir, file).replaceAll("\\", "/"), file]))(
    "%s",
    (_, file) => {
      expect(literalsIn(file, readFileSync(file, "utf8")), "put the word in the en and pt bundles and ask for it with t()").toEqual([])
    },
  )
})
