import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/** One route's metadata, as the product's route table declares it. */
export interface PrerenderRoute {
  path: string
  title: string
  description: string
  /** Defaults to `title`. */
  ogTitle?: string
  /** Defaults to `description`. */
  ogDescription?: string
}

/** One written route, as `manifest.json` lists it. */
export interface PrerenderedRoute {
  path: string
  url: string
  title: string
  description: string
  html: string
  markdown?: string
  htmlBytes: number
  markdownBytes?: number
}

export interface PrerenderSiteOptions {
  /** The client build's output, holding the `index.html` template. */
  distDir: string
  routes: readonly PrerenderRoute[]
  /** The hydratable render of one route, from the product's SSR entry. */
  render: (path: string) => string
  canonicalUrl: (path: string) => string
  /** The directory a route is written to, relative to `distDir`; "" is the root. */
  outputDir: (path: string) => string
  /** The absolute URL of the social card. Without it, no og:image tags are written. */
  ogImage?: string
  /** The route's Markdown twin, written beside it as `index.md`. */
  twin?: (path: string) => string
  /** `manifest.json`: the routes, their twins and their sizes. */
  manifest?: { name: string; base: string; llms?: string }
  /** `sitemap.xml`. `lastmod` defaults to the last git commit under the authored tree. */
  sitemap?: false | { lastmod?: string | null }
  /** `robots.txt`, pointing at the sitemap. */
  robots?: boolean
  /** The template to fill. Defaults to `<distDir>/index.html`. */
  template?: string
  /** Where the git date is read from, and which paths count as authored. */
  git?: { cwd: string; paths?: readonly string[] }
  log?: (line: string) => void
}

/** Replace the one match of `find`, or throw: a missing anchor is a drifted template. */
function replaceOrThrow(html: string, find: string | RegExp, replacement: string, label: string): string {
  const found = typeof find === "string" ? html.includes(find) : find.test(html)
  if (!found) throw new Error(`prerender: template no longer contains ${label}`)
  // A function, so a `$` in the replacement is text and never a pattern.
  return html.replace(find, () => replacement)
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const byteLength = (text: string) => Buffer.byteLength(text, "utf8")

/**
 * When the authored site last changed, as YYYY-MM-DD from git, or null.
 *
 * Not the build clock: a rebuild that changed nothing would tell a crawler that
 * every page did. One date for the whole authored tree, because a date per
 * route would need a second list of which sources make which page.
 */
export function lastAuthoredChange(cwd: string, paths: readonly string[] = ["src", "public", "index.html"]): string | null {
  try {
    const stamp = execFileSync("git", ["log", "-1", "--format=%cs", "--", ...paths], { cwd, encoding: "utf8" }).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp
  } catch {
    // No .git, or no git on PATH. A sitemap with no lastmod is valid.
  }
  return null
}

/** The tags the template's `</head>` gains: canonical, Open Graph and, with a card, Twitter's. */
function headFor(route: PrerenderRoute, canonical: string, ogImage: string | undefined): string {
  const card = ogImage
    ? [
        `<meta property="og:image" content="${escapeHtml(ogImage)}" />`,
        `<meta property="og:image:width" content="1200" />`,
        `<meta property="og:image:height" content="630" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:image" content="${escapeHtml(ogImage)}" />`,
      ]
    : []
  return [
    `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(route.ogTitle ?? route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.ogDescription ?? route.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
    ...card,
  ].join("\n    ")
}

/** The template filled for one route. */
function pageFor(template: string, route: PrerenderRoute, canonical: string, body: string, ogImage: string | undefined): string {
  let html = replaceOrThrow(template, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`, "a <title>")
  html = replaceOrThrow(
    html,
    /<meta\s+name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    'a <meta name="description">',
  )
  html = replaceOrThrow(html, "</head>", `  ${headFor(route, canonical, ogImage)}\n  </head>`, "a </head>")
  return replaceOrThrow(html, '<div id="root"></div>', `<div id="root">${body}</div>`, 'the <div id="root"> mount point')
}

/** The sitemap's date: the one passed (null for none), else git's, else none. */
function sitemapDate(options: PrerenderSiteOptions, sitemap: { lastmod?: string | null }): string | null {
  if (sitemap.lastmod !== undefined) return sitemap.lastmod
  return options.git ? lastAuthoredChange(options.git.cwd, options.git.paths) : null
}

function writeSitemap(options: PrerenderSiteOptions, sitemap: { lastmod?: string | null }) {
  const { distDir, routes, canonicalUrl } = options
  const lastmod = sitemapDate(options, sitemap)
  const urls = routes.map((route) => {
    const loc = `    <loc>${escapeHtml(canonicalUrl(route.path))}</loc>`
    const date = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
    return `  <url>\n${loc}${date}\n  </url>`
  })
  writeFileSync(
    join(distDir, "sitemap.xml"),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.join("\n") +
      "\n</urlset>\n",
  )
  if (options.robots ?? true) {
    writeFileSync(join(distDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${canonicalUrl("/")}sitemap.xml\n`)
  }
}

/**
 * The prerender step of a product site (VDS215): one render per route into the
 * client build's template, with the `<head>` patched by replace-or-throw, so a
 * drifted template fails the build rather than shipping a page under another
 * route's title. Beside it, optionally, the Markdown twin, `manifest.json`,
 * `sitemap.xml` and `robots.txt`, all from the same route table, so a route
 * that exists appears in each and a deleted one leaves all of them.
 *
 * The output is deterministic: no build timestamp, so the same input builds
 * byte-identical files.
 */
export function prerenderSite(options: PrerenderSiteOptions): PrerenderedRoute[] {
  const { distDir, routes, render, canonicalUrl, outputDir, ogImage, twin, log = () => {} } = options
  if (routes.length === 0) throw new Error("prerender: the route table is empty, so there is nothing to render")

  const template = readFileSync(options.template ?? join(distDir, "index.html"), "utf8")
  const written: PrerenderedRoute[] = []

  for (const route of routes) {
    const canonical = canonicalUrl(route.path)
    const html = pageFor(template, route, canonical, render(route.path), ogImage)

    const rel = outputDir(route.path)
    const dir = join(distDir, rel)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "index.html"), html)
    const htmlPath = rel ? `${rel}/index.html` : "index.html"

    const markdown = twin?.(route.path)
    const twinned = markdown !== undefined
    const markdownPath = rel ? `${rel}/index.md` : "index.md"
    if (twinned) writeFileSync(join(dir, "index.md"), markdown)

    // One literal, in the manifest's key order, which is what keeps its bytes stable.
    written.push({
      path: route.path,
      url: canonical,
      title: route.title,
      description: route.description,
      html: htmlPath,
      ...(twinned ? { markdown: markdownPath } : {}),
      htmlBytes: byteLength(html),
      ...(twinned ? { markdownBytes: byteLength(markdown) } : {}),
    })
    log(`prerendered ${route.path.padEnd(12)} -> ${htmlPath}` + (twinned ? ` + ${markdownPath}` : ""))
  }

  if (options.manifest) {
    const { name, base, llms } = options.manifest
    const manifest = { name, base, ...(llms ? { llms } : {}), routes: written }
    writeFileSync(join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n")
  }

  const sitemap = options.sitemap ?? {}
  if (sitemap !== false) writeSitemap(options, sitemap)

  return written
}
