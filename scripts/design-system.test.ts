import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { PREVIEWS, assemble, canvasTokens, latinFaces, previewHtml } from "./design-system.mjs"
import { tailwindTheme, typeScale } from "./foundations-reference.mjs"
import { GLOBAL_BUILD } from "./lib/global-build.mjs"
import { tokensJson } from "./lib/tokens-json.mjs"

// VDS239 — the folder a design canvas installs. Assembled here from a fixture
// dist (the test job runs before the build), and held to the grammar the
// canvas's Design System type reads: a value it cannot read is dropped there
// silently, so it has to fail here instead.

const repo = resolve(import.meta.dirname, "..")
const preset = readFileSync(join(repo, "src", "styles", "preset.css"), "utf8")
const json = tokensJson(preset)

/** The canvas's name rule, and the colour forms it reads without dropping. */
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/
const COLOUR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/

describe("the canvas tokens", () => {
  const tokens = canvasTokens(json, typeScale(tailwindTheme()), "16px", {})

  it("are lists, never the DTCG map the canvas cannot read", () => {
    expect(Array.isArray(tokens.color.tokens)).toBe(true)
    expect(Array.isArray(tokens.radius.tokens)).toBe(true)
    expect(Array.isArray(tokens.control.tokens)).toBe(true)
    expect(tokens.color.themes.map((t: { id: string }) => t.id)).toEqual([
      "light",
      "dark",
      "warm-light",
      "warm-dark",
      "navy-light",
      "navy-dark",
    ])
  })

  it("name every token once, in the form the canvas keeps", () => {
    const names = [...tokens.color.tokens, ...tokens.radius.tokens, ...tokens.control.tokens].map((t) => t.name)
    for (const name of names) expect(name).toMatch(NAME)
    expect(new Set(names).size).toBe(names.length)
  })

  it("give every colour a value it reads on every theme, and a usage note", () => {
    for (const token of tokens.color.tokens) {
      expect(Object.keys(token.value), token.name).toHaveLength(6)
      for (const value of Object.values(token.value)) expect(value, token.name).toMatch(COLOUR)
      expect(token.usage, token.name).not.toBe("")
    }
  })

  it("carries the type steps and font stacks the canvas can parse", () => {
    const text = tokens.type.groups.find((g: { name: string }) => g.name === "Text")!
    expect(text.styles.map((s: { name: string }) => s.name)).toEqual(["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-sm", "text-xs"])
    for (const stack of Object.values(tokens.type.families) as string[]) {
      expect(stack.length).toBeLessThanOrEqual(200)
      expect(stack).not.toMatch(/[;{}<>\\()]/)
    }
  })
})

describe("the previews", () => {
  it("draw every component the browser build publishes", () => {
    expect(Object.keys(PREVIEWS).sort()).toEqual([...GLOBAL_BUILD.components].sort())
  })

  it("open with the card marker and mount from window.VigletDS", () => {
    for (const name of GLOBAL_BUILD.components) {
      const html = previewHtml(name)
      expect(html.split("\n")[0]).toMatch(/^<!-- @dsCard group="\w+" height=\d+ -->$/)
      expect(html).toContain("window.VigletDS")
      expect(html).toContain(`ds.${name}`)
    }
  })
})

describe("the assembled folder", () => {
  let root: string
  let out: string
  let written: string[]

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), "vds-ds-"))
    out = join(root, "out")
    for (const dir of ["dist/fonts", "docs", "src/styles"]) mkdirSync(join(root, dir), { recursive: true })
    copyFileSync(join(repo, "src", "styles", "preset.css"), join(root, "src", "styles", "preset.css"))
    copyFileSync(join(repo, "docs", "BRAND.md"), join(root, "docs", "BRAND.md"))
    writeFileSync(join(root, "dist", GLOBAL_BUILD.file), "var VigletDS=(function(){return{}})();\n")
    writeFileSync(join(root, "dist", "tokens.json"), JSON.stringify(json))
    writeFileSync(join(root, "dist", "viglet-design-system.css"), ":root{--vg-background:#fff}\n")
    writeFileSync(join(root, "dist", "bento.css"), ".bento-tile{}\n")
    writeFileSync(
      join(root, "dist", "fonts.css"),
      "@font-face{font-family:'Inter Variable';font-weight:100 900;src:url(./fonts/inter-latin-wght-normal.woff2) format('woff2-variations')}\n" +
        "@font-face{font-family:'Inter Variable';font-weight:100 900;src:url(./fonts/inter-greek-wght-normal.woff2) format('woff2-variations')}\n",
    )
    writeFileSync(join(root, "dist", "fonts", "inter-latin-wght-normal.woff2"), "wOF2")
    const catalogue = {
      components: GLOBAL_BUILD.components.map((name) => ({
        name,
        specifier: "@viglet/viglet-design-system",
        summary: `${name} does one thing.`,
        description: `${name} does one thing. Then more.`,
        props: [{ name: "variant", type: '"a" | "b" | undefined', optional: true, summary: "Which look." }],
      })),
    }
    writeFileSync(join(root, "dist", "catalogue.json"), JSON.stringify(catalogue))
    written = assemble({ root, out, at: "2026-11-06T12:00:00.000Z", by: "Tester", branch: "2026.3", ref: "2026.3@abc1234" })
  })

  afterAll(() => rmSync(root, { recursive: true, force: true }))

  const read = (path: string) => readFileSync(join(out, "project", path), "utf8")

  it("writes the files the Design System type keeps, under project/", () => {
    for (const path of ["design-system.json", "README.md", "tokens.json", "components/bundle.js", "components/bundle.css"]) {
      expect(written).toContain(path)
    }
    for (const name of GLOBAL_BUILD.components) {
      expect(written).toContain(`components/${name}/README.md`)
      expect(written).toContain(`components/${name}/preview.html`)
    }
  })

  it("puts the bundle under the header that names its namespace and components", () => {
    const [header, body] = read("components/bundle.js").split("\n")
    const declared = JSON.parse(header.replace(/^\/\* @ds-bundle: /, "").replace(/ \*\/$/, ""))
    expect(declared).toEqual({ format: 4, namespace: "VigletDS", components: GLOBAL_BUILD.components.map((name) => ({ name })) })
    expect(body).toContain("var VigletDS")
  })

  it("writes the index for a first publish, with the marker and the namespace", () => {
    const index = JSON.parse(read("design-system.json"))
    expect(index).toMatchObject({ v: 3, layout: "files", title: "Viglet Design System", namespace: "VigletDS" })
    expect(index.createdOnFiles.at).toBe("2026-11-06T12:00:00.000Z")
    expect(index.lastChange.by).toBe("Tester")
  })

  it("assembles the README from BRAND.md and the catalogue, with links that leave the repository", () => {
    const readme = read("README.md")
    expect(readme).toContain("2026.3@abc1234")
    expect(readme).toContain("| `Button` | Button does one thing. |")
    expect(readme).toMatch(/^## Part one: every page on the package$/m)
    expect(readme).not.toMatch(/^# How a product writes/m)
    expect(readme).toContain("https://github.com/openviglet/viglet-design-system/blob/2026.3/docs/BENTO-AUTHORING.md")
    expect(readme).not.toMatch(/\]\(BENTO-AUTHORING\.md/)
  })

  it("copies only the Latin faces and lists them for the canvas", () => {
    expect(written).toContain("fonts/inter-latin-wght-normal.woff2")
    const tokens = JSON.parse(read("tokens.json"))
    expect(tokens.type.fonts).toEqual([{ family: "Inter Variable", file: "fonts/inter-latin-wght-normal.woff2", weight: "100 900", style: "normal" }])
    expect(tokens.meta).toMatchObject({ source: "github", ref: "2026.3@abc1234" })
  })

  it("refuses a dist that is missing a file, rather than writing half a system", () => {
    rmSync(join(root, "dist", "bento.css"))
    expect(() => assemble({ root, out, at: "x", by: "y", branch: "b", ref: "r" })).toThrow(/dist\/bento\.css is missing/)
  })
})

describe("latinFaces", () => {
  it("reads the family and weight range of each Latin face", () => {
    const faces = latinFaces(
      "@font-face { font-family: 'Plus Jakarta Sans Variable'; font-weight: 200 800; src: url(./fonts/plus-jakarta-sans-latin-wght-normal.woff2) }",
    )
    expect(faces).toEqual([{ family: "Plus Jakarta Sans Variable", file: "fonts/plus-jakarta-sans-latin-wght-normal.woff2", weight: "200 800", style: "normal" }])
  })
})
