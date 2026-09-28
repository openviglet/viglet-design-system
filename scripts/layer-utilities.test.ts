// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { compile, optimize } from "@tailwindcss/node"
import { chromium, type Browser } from "playwright"
import postcss from "postcss"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { PLAIN_LAYER, VARIANT_LAYER, isVariantRule, layerUtilities } from "./lib/layer-utilities.mjs"

const root = resolve(import.meta.dirname, "..")
const fixture = resolve(root, "node_modules/.tmp/layer-utilities")

describe("telling a variant utility from a plain one", () => {
  it.each([
    [".hidden", false],
    [".lg\\:block", true],
    [".hover\\:bg-accent:hover", true],
    [".\\[\\&\\>svg\\]\\:size-4>svg", true],
    [".data-\\[state\\=open\\]\\:flex[data-state=open]", true],
    [".\\32 xl\\:flex", true],
    [".\\[mask-type\\:luminance\\]", false],
    [".w-1\\/2", false],
    [":where(.divide-border>:not(:last-child))", false],
    [".group-hover\\/menu-item\\:opacity-100:is(:where(.group\\/menu-item):hover *)", true],
    ["::backdrop", false],
  ])("%s is a variant: %s", (selector, variant) => {
    expect(isVariantRule(selector)).toBe(variant)
  })
})

describe("moving the package utilities", () => {
  const css = [
    "@layer theme{:root{--x:1}}",
    "@layer utilities{.hidden{display:none}.flex{display:flex}",
    "@supports (color:color-mix(in lab,red,red)){.bg-a{color:red}.hover\\:bg-a:hover{color:red}}",
    "@media (width>=64rem){.lg\\:block{display:block}}}",
  ].join("")
  const out = postcss.parse(layerUtilities(css))
  const layers = out.nodes.filter((node) => node.type === "atrule")

  it("keeps plain utilities in a layer nested under the consumer's utilities", () => {
    const utilities = layers.find((node) => node.params === "utilities")
    expect(utilities?.nodes?.map((node) => (node as postcss.AtRule).params)).toEqual([PLAIN_LAYER])
    expect(utilities?.toString()).toContain(".hidden")
    expect(utilities?.toString()).not.toContain("lg\\:block")
  })

  it("puts variants in a layer named after utilities, so it is ordered above it", () => {
    expect(layers.map((node) => node.params)).toEqual(["theme", "utilities", VARIANT_LAYER])
    const variants = layers[2].toString()
    expect(variants).toContain(".lg\\:block")
    expect(variants).not.toContain(".hidden")
  })

  it("splits an at-rule that wraps both kinds", () => {
    const text = out.toString()
    expect(text.match(/@supports/g)).toHaveLength(2)
    expect(layers[1].toString()).toContain(".bg-a")
    expect(layers[2].toString()).toContain(".hover\\:bg-a")
  })
})

/**
 * The Shio console on 2026-09-28: `hidden lg:block` in the product, the package
 * stylesheet imported after `tailwindcss`, and the element hidden at 1440 px.
 * Both sides are compiled the way they are in real life, the package from its
 * own `src/styles/index.css` and the consumer by importing the result.
 */
describe("a consumer importing the package stylesheet", () => {
  let browser: Browser

  beforeAll(async () => {
    browser = await chromium.launch()
  })
  afterAll(async () => {
    await browser?.close()
  })

  async function packageCss() {
    const base = resolve(root, "src/styles")
    const source = `@import "./index.css";`
    const compiler = await compile(source, { base, onDependency() {} })
    return optimize(compiler.build(["hidden", "md:flex"]), { minify: true }).code
  }

  async function consumerCss(pkg: string) {
    mkdirSync(fixture, { recursive: true })
    writeFileSync(resolve(fixture, "package.css"), pkg)
    const source = `@import "tailwindcss";\n@import "./package.css";`
    const compiler = await compile(source, { base: fixture, onDependency() {} })
    return optimize(compiler.build(["hidden", "lg:block"]), { minify: true }).code
  }

  async function displays(css: string, width: number) {
    const page = await browser.newPage({ viewport: { width, height: 800 } })
    await page.setContent(`<style>${css}</style>
      <div id="consumer" class="hidden lg:block">shown at lg</div>
      <div id="package" class="hidden md:flex">shown at md</div>`)
    // A string, because this file is checked without the DOM types.
    const read = await page.evaluate<string[]>(
      `["consumer", "package"].map((id) => getComputedStyle(document.getElementById(id)).display)`,
    )
    await page.close()
    return read
  }

  it("reproduces the defect when the utilities are left where Tailwind put them", async () => {
    expect(await displays(await consumerCss(await packageCss()), 1440)).toEqual(["none", "flex"])
  }, 60_000)

  it("shows hidden lg:block at a large viewport, and keeps the package's md:flex", async () => {
    const css = await consumerCss(layerUtilities(await packageCss()))
    expect(await displays(css, 1440)).toEqual(["block", "flex"])
    expect(await displays(css, 600)).toEqual(["none", "none"])
  }, 60_000)
})
