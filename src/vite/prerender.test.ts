// @vitest-environment node
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { prerenderSite, type PrerenderSiteOptions } from "./prerender"

/**
 * VDS215 — the prerender step eight product sites each carried a copy of. The
 * output shape is claude-tray's, which is what the first site to adopt the
 * helper will diff its build against.
 */

const TEMPLATE = [
  "<!doctype html>",
  "<html>",
  "  <head>",
  "    <title>placeholder</title>",
  '    <meta name="description" content="placeholder" />',
  "  </head>",
  "  <body>",
  '    <div id="root"></div>',
  "  </body>",
  "</html>",
].join("\n")

let dist: string

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), "vds-prerender-"))
  writeFileSync(join(dist, "index.html"), TEMPLATE)
})

afterEach(() => {
  rmSync(dist, { recursive: true, force: true })
})

const base = "https://example.org/tool/"

function options(overrides: Partial<PrerenderSiteOptions> = {}): PrerenderSiteOptions {
  return {
    distDir: dist,
    routes: [
      { path: "/", title: "Tool — home", description: "What it does & why." },
      { path: "/features/a/", title: "Pillar A", description: "A, in depth.", ogTitle: "A card" },
    ],
    render: (path) => `<main>${path}</main>`,
    canonicalUrl: (path) => base + path.replace(/^\//, ""),
    outputDir: (path) => path.replace(/^\/|\/$/g, ""),
    ogImage: `${base}og.png`,
    sitemap: { lastmod: "2026-10-19" },
    ...overrides,
  }
}

const read = (rel: string) => readFileSync(join(dist, rel), "utf8")

describe("prerenderSite", () => {
  it("writes one page per route, with the head patched and the body rendered", () => {
    prerenderSite(options())
    const home = read("index.html")
    expect(home).toContain("<title>Tool — home</title>")
    expect(home).toContain('<meta name="description" content="What it does &amp; why." />')
    expect(home).toContain('<link rel="canonical" href="https://example.org/tool/" />')
    expect(home).toContain('<meta property="og:image" content="https://example.org/tool/og.png" />')
    expect(home).toContain('<div id="root"><main>/</main></div>')

    const feature = read("features/a/index.html")
    expect(feature).toContain('<meta property="og:title" content="A card" />')
    expect(feature).toContain('<meta property="og:description" content="A, in depth." />')
  })

  it("lays the head block out the way the sites' own script did", () => {
    prerenderSite(options())
    expect(read("index.html")).toContain(
      '    <link rel="canonical" href="https://example.org/tool/" />\n    <meta property="og:type" content="website" />',
    )
    expect(read("index.html")).toMatch(/twitter:image" content="[^"]+" \/>\n {2}<\/head>/)
  })

  it("writes no card tags when there is no card", () => {
    prerenderSite(options({ ogImage: undefined }))
    expect(read("index.html")).not.toContain("og:image")
    expect(read("index.html")).not.toContain("twitter:card")
  })

  it("fails the build on a drifted template rather than shipping it", () => {
    writeFileSync(join(dist, "index.html"), TEMPLATE.replace('<div id="root"></div>', '<div id="app"></div>'))
    expect(() => prerenderSite(options())).toThrow('template no longer contains the <div id="root"> mount point')
  })

  it("refuses an empty route table", () => {
    expect(() => prerenderSite(options({ routes: [] }))).toThrow("route table is empty")
  })

  it("keeps a dollar sign in the copy as text", () => {
    prerenderSite(options({ routes: [{ path: "/", title: "Costs $& more", description: "$1 a month" }] }))
    expect(read("index.html")).toContain("<title>Costs $&amp; more</title>")
  })

  it("writes the twin and the manifest, in the manifest's key order", () => {
    const written = prerenderSite(
      options({ twin: (path) => `# ${path}\n`, manifest: { name: "Tool", base: "/tool/", llms: "llms.txt" } }),
    )
    expect(read("features/a/index.md")).toBe("# /features/a/\n")
    const manifest = read("manifest.json")
    expect(manifest.endsWith("}\n")).toBe(true)
    const parsed = JSON.parse(manifest)
    expect(Object.keys(parsed)).toEqual(["name", "base", "llms", "routes"])
    expect(Object.keys(parsed.routes[0])).toEqual([
      "path",
      "url",
      "title",
      "description",
      "html",
      "markdown",
      "htmlBytes",
      "markdownBytes",
    ])
    expect(parsed.routes).toEqual(written)
    expect(parsed.routes[1].html).toBe("features/a/index.html")
  })

  it("writes the sitemap and robots from the same routes", () => {
    prerenderSite(options())
    expect(read("sitemap.xml")).toBe(
      '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        "  <url>\n    <loc>https://example.org/tool/</loc>\n    <lastmod>2026-10-19</lastmod>\n  </url>\n" +
        "  <url>\n    <loc>https://example.org/tool/features/a/</loc>\n    <lastmod>2026-10-19</lastmod>\n  </url>\n" +
        "</urlset>\n",
    )
    expect(read("robots.txt")).toBe("User-agent: *\nAllow: /\n\nSitemap: https://example.org/tool/sitemap.xml\n")
  })

  it("omits lastmod rather than guessing one", () => {
    prerenderSite(options({ sitemap: { lastmod: null } }))
    expect(read("sitemap.xml")).not.toContain("lastmod")
  })

  it("writes neither file when the sitemap is off", () => {
    prerenderSite(options({ sitemap: false }))
    expect(existsSync(join(dist, "sitemap.xml"))).toBe(false)
    expect(existsSync(join(dist, "robots.txt"))).toBe(false)
  })

  it("builds the same bytes twice", () => {
    const run = () => {
      prerenderSite(options({ twin: (p) => p, manifest: { name: "Tool", base: "/tool/" } }))
      return ["index.html", "manifest.json", "sitemap.xml"].map(read).join("\0")
    }
    const first = run()
    writeFileSync(join(dist, "index.html"), TEMPLATE)
    expect(run()).toBe(first)
  })
})
