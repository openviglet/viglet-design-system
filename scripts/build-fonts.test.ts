import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { familiesIn, rewriteFaces } from "./build-fonts.mjs"

const root = resolve(import.meta.dirname, "..")

/**
 * VDS44 — a shipped stylesheet resolves nothing through the consumer's tree.
 *
 * `fonts.css` used to ship verbatim with `@import "@fontsource-variable/inter"`
 * in it, resolved by whatever the consumer's bundler looked at. It worked only
 * because all three products use pnpm's hoisted linker, and the failure is the
 * silent kind: a missing `@import` is not an error, the type falls back through
 * `--font-sans` to `system-ui`, and nobody sees it until a screenshot.
 *
 * `check-dist` refuses a bare specifier or a dangling `url()` in anything
 * shipped. What is left to hold here is the rewrite that produces the file, and
 * particularly its refusal: a stylesheet whose faces are not where it says is
 * the same silent failure wearing a different hat.
 */
describe("the font stylesheet is rewritten to files beside it", () => {
  const oneFace = [
    "@font-face {",
    "  font-family: 'Inter Variable';",
    "  src: url(./files/inter-latin-wght-normal.woff2) format('woff2-variations');",
    "}",
  ].join("\n")

  it("points the url at ./fonts/ and reports the file to copy", () => {
    const copied: Array<[string, string]> = []
    const { css, files } = rewriteFaces(oneFace, {
      onFile: (from: string, to: string) => copied.push([from, to]),
    })

    expect(css).toContain("url(./fonts/inter-latin-wght-normal.woff2)")
    expect(css).not.toContain("./files/")
    expect(copied).toEqual([
      ["files/inter-latin-wght-normal.woff2", "inter-latin-wght-normal.woff2"],
    ])
    expect([...files]).toEqual(["inter-latin-wght-normal.woff2"])
  })

  it("copies each face once even when several rules share one", () => {
    const twice = oneFace + "\n" + oneFace
    const { files } = rewriteFaces(twice, { onFile: () => {} })
    expect(files.size).toBe(1)
  })

  it("finds nothing to copy when the package layout changes", () => {
    // The caller turns this into a refusal rather than shipping a stylesheet
    // that references faces which are not there.
    const moved = oneFace.replace("./files/", "./webfonts/")
    const { files } = rewriteFaces(moved, { onFile: () => {} })
    expect(files.size).toBe(0)
  })

  it("leaves a url that is already relative to the stylesheet alone", () => {
    const already = "@font-face { src: url(./fonts/inter.woff2); }"
    const { css, files } = rewriteFaces(already, { onFile: () => {} })
    expect(css).toBe(already)
    expect(files.size).toBe(0)
  })
})

describe("the families are named once", () => {
  it("reads them from the source stylesheet", () => {
    // VDS45 — they were listed here and in fonts.css, which is the defect VDS43
    // removed from the externals: two places naming one set, free to disagree.
    const source = readFileSync(join(root, "src", "styles", "fonts.css"), "utf8")
    expect(familiesIn(source)).toEqual([
      "@fontsource-variable/inter",
      "@fontsource-variable/plus-jakarta-sans",
    ])
  })

  it("ignores the imports the banner quotes as an example", () => {
    // The comment in that file shows a consumer the two lines to write. Reading
    // those as declarations made the script try to resolve this package into
    // itself, which is how this was found.
    const quoted = [
      '/* Usage:',
      '     @import "@viglet/viglet-design-system/styles";',
      '     @import "@viglet/viglet-design-system/fonts";',
      ' */',
      '@import "@fontsource-variable/inter";',
    ].join("\n")
    expect(familiesIn(quoted)).toEqual(["@fontsource-variable/inter"])
  })

  it("refuses rather than writing a stylesheet with no faces in it", () => {
    expect(() => familiesIn("/* nothing here */")).toThrow(/imports no font package/)
  })

  it("ignores a relative import, which is not a family", () => {
    expect(() => familiesIn('@import "./preset.css";')).toThrow(/imports no font package/)
  })
})

describe("what was built is what ships", () => {
  const distCss = join(root, "dist", "fonts.css")

  it("carries the faces and no bare import", () => {
    if (!existsSync(distCss)) return
    const css = readFileSync(distCss, "utf8")
    const rules = css.replaceAll(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, "")

    expect((css.match(/@font-face/g) ?? []).length).toBeGreaterThanOrEqual(10)
    expect(rules).not.toContain("@fontsource")
    // Inlining is what VDS41 took out; files are what VDS44 put in.
    expect(css).not.toContain("base64")
  })

  it("references only files that are in the package", () => {
    if (!existsSync(distCss)) return
    const css = readFileSync(distCss, "utf8")
    const urls = [...css.matchAll(/url\(\s*(\.[^)\s]+)\s*\)/g)].map((m) => m[1])

    expect(urls.length, "the stylesheet references no faces at all").toBeGreaterThanOrEqual(10)
    for (const url of urls) {
      expect(existsSync(resolve(dirname(distCss), url)), `${url} is missing`).toBe(true)
    }
  })
})
