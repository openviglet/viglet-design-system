#!/usr/bin/env node
// VDS180 — how the bento consumers look, measured in a browser.
//
//   pnpm look:census --url shio=http://localhost:5173/bento --auth shio=user:pass
//   pnpm look:census --url shio=… --json     # the reading, route by route
//   pnpm look:census --url shio=… --write    # record the reading as the allowance
//
// `chrome:census` counts imports and `viglet-ds-page-lint` reads a page's source.
// Neither loads a page, and a walk of the Shio console found fifteen button heights,
// ten radii and three monospace stacks that no check here could see. So this loads
// each consumer's running dev server and measures what it draws.
//
// The routes are crawled, not declared: the walk starts at the URL given and follows
// same-origin links under that path, one route per shape (an id segment reads as
// `:id`), so no product's routes are written into this repository. Three views are
// read: desktop dark, desktop light and a 390 px phone.
//
// Every measured element is attributed. React 19 keeps, on each fiber in a dev build,
// the stack of the JSX call that created it, so the file that wrote a `<button>` is
// known. A frame in the package's bundle (or a Vite deps chunk whose sourcemap says
// it came from the package) is `package`; one in the product's own source is
// `product`; a third-party frame (Radix, say) hands the question to the element's
// owner. That split says whether a figure is fixed here or in a product.
// A product's className on a package component still reads as `package`: the
// attribution is who wrote the element, not who styled it last.
//
// The first reading of each consumer is committed as look-allowance.json with the
// offenders named. A later run fails when a figure grows past it, so each task in the
// look round lowers a number instead of claiming an improvement. A consumer this
// machine cannot load stays in the allowance as not measured, with the reason.

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { probe } from "./look-census-probe.mjs"

export const VIEWS = [
  { id: "desktop-dark", width: 1440, height: 900, theme: "dark" },
  { id: "desktop-light", width: 1440, height: 900, theme: "light" },
  { id: "phone-dark", width: 390, height: 844, theme: "dark" },
]

/** What each figure counts. `title-x` is kept per view, since a phone moves the title on purpose. */
export const FIGURES = {
  "button-height": "button heights (px)",
  "input-height": "input and select heights (px)",
  radius: "border radii",
  font: "text font families",
  mono: "monospace stacks",
  "primary-fill": "saturated fills painting a button",
  "title-x": "page title left offset (px)",
}

const OWNERS = ["package", "product", "unknown"]
const MAX_ROUTES = 60
const OFFENDERS_PER_VALUE = 8

// ---------------------------------------------------------------------------
// Routes

const ID_SEGMENT =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\d+|[0-9a-f]{16,}|(?=[^/]*\d)[A-Za-z0-9_-]{16,})$/i
const LEAVES = /(?:^|[/-])(?:log-?out|sign-?out)(?:$|[/?#])/i
const FILE = /\.[a-z0-9]{2,5}$/i

/** A path with its id segments folded, so /users/42 and /users/7 are one route. */
export function routePattern(pathname) {
  const folded = pathname
    .split("/")
    .map((segment) => (ID_SEGMENT.test(segment) ? ":id" : segment))
    .join("/")
    .replace(/\/+$/, "")
  return folded === "" ? "/" : folded
}

/** Whether a concrete path fits a router pattern: `:param` is one segment, `*` the rest. */
export function fits(pattern, pathname) {
  const want = pattern.split("/").filter(Boolean)
  const have = pathname.split("/").filter(Boolean)
  for (let i = 0; i < want.length; i++) {
    const segment = want[i].replace(/\?$/, "")
    if (segment === "*") return true
    if (i >= have.length) return false
    if (!segment.startsWith(":") && segment !== have[i]) return false
  }
  return want.length === have.length
}

/**
 * The route a path is: the most specific router pattern it fits, so an id or a
 * username never becomes part of a route's name; a path no pattern fits has its
 * id-shaped segments folded instead.
 */
export function routeOf(pathname, patterns) {
  let best = null
  let score = -1
  for (const pattern of patterns) {
    if (pattern.includes("*") || !fits(pattern, pathname)) continue
    const fixed = pattern.split("/").filter((s) => s && !s.startsWith(":")).length
    if (fixed > score) {
      best = pattern.replace(/\/+$/, "") || "/"
      score = fixed
    }
  }
  return best ?? routePattern(pathname)
}

/**
 * A read page's route: the router match the probe found, unless it is a splat,
 * else the path named against the patterns known.
 */
export function nameRoute(path, match, patterns) {
  if (match && !match.includes("*")) return match.replace(/\/+$/, "") || "/"
  return routeOf(path, patterns)
}

/** Whether a link is a route to walk: same origin, under the start path, not a sign-out or a file. */
export function walkable(href, start) {
  let url
  try {
    url = new URL(href, start)
  } catch {
    return false
  }
  const base = new URL(start)
  if (url.origin !== base.origin) return false
  const prefix = base.pathname.replace(/\/+$/, "")
  if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return false
  return !LEAVES.test(url.pathname) && !FILE.test(url.pathname)
}

// ---------------------------------------------------------------------------
// Attribution: sourcemaps, frames, owner chains

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"

function vlq(segment) {
  const values = []
  let value = 0
  let shift = 0
  for (const ch of segment) {
    const digit = B64.indexOf(ch)
    value += (digit & 31) * 2 ** shift
    if (digit & 32) {
      shift += 5
    } else {
      values.push(value % 2 === 1 ? -Math.floor(value / 2) : value / 2)
      value = 0
      shift = 0
    }
  }
  return values
}

/** A source map's `mappings`, decoded to `[generatedColumn, sourceIndex]` per generated line. */
export function decodeMappings(mappings) {
  const lines = []
  let source = 0
  for (const line of mappings.split(";")) {
    const segments = []
    let column = 0
    if (line !== "") {
      for (const segment of line.split(",")) {
        const fields = vlq(segment)
        column += fields[0]
        if (fields.length >= 4) {
          source += fields[1]
          segments.push([column, source])
        }
      }
    }
    lines.push(segments)
  }
  return lines
}

/** The original source behind a generated position (1-based line and column, as a stack prints them). */
export function sourceAt(map, decoded, line, column) {
  const segments = decoded[line - 1]
  if (!segments) return null
  let hit = null
  for (const segment of segments) {
    if (segment[0] > column - 1) break
    hit = segment
  }
  return hit ? (map.sources[hit[1]] ?? null) : null
}

const PACKAGE_PATH = /viglet[-_]design[-_]system/
const REACT_SOURCE = /node_modules[/\\](?:react|react-dom|scheduler)[/\\]|react[-_]jsx|react[-_]dom/
const REACT_URL = /\/(?:react[-_.][^/]*|react)\.js$|\/@react-refresh|\/@vite\//

/**
 * A classifier for one frame: `package`, `product`, `react` (skipped) or `third`.
 * `loadMap(url)` returns a source map for a dependency chunk, or null.
 */
export function makeClassifier(loadMap) {
  const maps = new Map()
  async function mapFor(url) {
    if (!maps.has(url)) {
      maps.set(
        url,
        loadMap(url).then((map) => (map && typeof map.mappings === "string" ? { map, decoded: decodeMappings(map.mappings) } : null)),
      )
    }
    return maps.get(url)
  }
  return async function classify(frame) {
    let path
    try {
      path = new URL(frame.url).pathname
    } catch {
      return "third"
    }
    if (PACKAGE_PATH.test(path)) return "package"
    if (REACT_URL.test(path)) return "react"
    if (!path.includes("/node_modules/")) return "product"
    const entry = await mapFor(frame.url.replace(/[?#].*$/, ""))
    const source = entry ? sourceAt(entry.map, entry.decoded, frame.line, frame.column) : null
    if (source === null) return "third"
    if (PACKAGE_PATH.test(source)) return "package"
    if (REACT_SOURCE.test(source)) return "react"
    return "third"
  }
}

/**
 * Who wrote an element: the first stack in its owner chain whose first non-React
 * frame is package or product code. A chain of only third-party frames, or no
 * chain at all (a production build, a node React never rendered), is `unknown`.
 */
export async function ownerOf(chain, stacks, classify) {
  for (const index of chain) {
    for (const frame of stacks[index] ?? []) {
      const kind = await classify(frame)
      if (kind === "react") continue
      if (kind === "package" || kind === "product") return kind
      break
    }
  }
  return "unknown"
}

// ---------------------------------------------------------------------------
// The in-page probe lives in look-census-probe.mjs, free of node imports.

export { probe }

// ---------------------------------------------------------------------------
// Two reads of one page (VDS188)

/**
 * What two reads of the same page agree on. Two runs against an unchanged console
 * disagreed on radii, fills and dock overlaps, because whatever was still moving
 * was read mid-flight. So every route is read twice and a value counts only when
 * both reads saw it, as many times as the scarcer read saw it. A value seen by one
 * read alone is reported as unstable instead of counted.
 *
 * Samples are the probe's `[figure, value, chain]`; the chain is not compared,
 * since it indexes each read's own table.
 */
export function agree(first, second) {
  const key = (s) => `${s[0]} ${s[1]}`
  const left = new Map()
  for (const s of second) left.set(key(s), (left.get(key(s)) ?? 0) + 1)
  const samples = []
  for (const s of first) {
    const n = left.get(key(s)) ?? 0
    if (n > 0) {
      samples.push(s)
      left.set(key(s), n - 1)
    }
  }
  const seenFirst = new Set(first.map(key))
  const seenSecond = new Set(second.map(key))
  const unstable = [...new Set([...seenFirst, ...seenSecond])].filter((k) => !seenFirst.has(k) || !seenSecond.has(k))
  return { samples, unstable: unstable.sort() }
}

// ---------------------------------------------------------------------------
// Gaps: what a view did not measure (VDS189)

/**
 * The routes each view did not measure, keyed by view, for views that missed any.
 * A route is measured when the view's reading of it kept its title offset: the
 * probe samples one on every page (`none` included), so a reading without it
 * failed to load or never held still across the two reads. A view that read
 * fewer routes than the others reports fewer distinct values, which reads as a
 * figure lowered when nothing on the page changed.
 */
export function gaps(readings) {
  const routes = [...new Set(readings.map((r) => r.route))].sort()
  const measured = new Map(VIEWS.map((v) => [v.id, new Set()]))
  for (const r of readings) {
    if (r.samples.some((s) => s.figure === "title-x")) measured.get(r.view)?.add(r.route)
  }
  const out = {}
  for (const view of VIEWS) {
    const missing = routes.filter((route) => !measured.get(view.id).has(route))
    if (missing.length > 0) out[view.id] = missing
  }
  return out
}

/** The readings of the routes every view measured, which is what a figure is compared over. */
export function complete(readings) {
  const missing = new Set(Object.values(gaps(readings)).flat())
  return readings.filter((r) => !missing.has(r.route))
}

// ---------------------------------------------------------------------------
// Readings: tally, allowance, comparison

/**
 * One consumer's readings folded into figures. A reading is one route in one view:
 * `{ route, view, samples: [{ figure, value, owner }], primaries, overlaps }`.
 */
export function tally(readings) {
  const figures = {}
  const crowded = {}
  const dock = {}
  const tiles = {}
  for (const r of readings) {
    for (const s of r.samples) {
      const figure = s.figure === "title-x" ? `title-x@${r.view}` : s.figure
      const values = (figures[figure] ??= {})
      const cell = (values[s.value] ??= { package: 0, product: 0, unknown: 0, routes: new Set() })
      cell[s.owner] += 1
      cell.routes.add(r.route)
    }
    if (r.primaries > 1) crowded[r.route] = Math.max(crowded[r.route] ?? 0, r.primaries)
    if (r.overlaps.length > 0) dock[r.route] = Math.max(dock[r.route] ?? 0, r.overlaps.length)
    if ((r.tiles ?? 0) > 0) tiles[r.route] = Math.max(tiles[r.route] ?? 0, r.tiles)
  }
  return { figures, crowded, dock, tiles }
}

const total = (cell) => cell.package + cell.product + cell.unknown

/**
 * What a tally records as the allowance. Per figure: how many distinct values, how
 * each value splits by owner, and the routes carrying any value but the most common
 * one, which are the offenders a later task lowers.
 */
export function allowanceOf(tallied) {
  const figures = {}
  for (const [figure, values] of Object.entries(tallied.figures).sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = Object.entries(values).sort((a, b) => total(b[1]) - total(a[1]) || a[0].localeCompare(b[0]))
    const byOwner = Object.fromEntries(
      OWNERS.map((owner) => [owner, ordered.filter(([, cell]) => cell[owner] > 0).length]),
    )
    figures[figure] = {
      distinct: ordered.length,
      byOwner,
      values: Object.fromEntries(
        ordered.map(([value, cell]) => [value, { package: cell.package, product: cell.product, unknown: cell.unknown }]),
      ),
      offenders: Object.fromEntries(
        ordered.slice(1).map(([value, cell]) => [value, [...cell.routes].sort().slice(0, OFFENDERS_PER_VALUE)]),
      ),
    }
  }
  const sorted = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
  return { figures, crowded: sorted(tallied.crowded), dock: sorted(tallied.dock), tiles: sorted(tallied.tiles ?? {}) }
}

/**
 * A new reading against the recorded one. `grew` fails the run; `lowered` is a
 * number a task brought down, which `--write` then records.
 *
 * `holes` is what `gaps` found. With any, the reading covers fewer routes than the
 * allowance did, so a lower count says nothing and `lowered` stays empty; growth
 * over fewer routes is still growth, so `grew` is kept.
 */
export function compare(id, allowed, current, holes = {}) {
  const grew = []
  const lowered = []
  const figures = new Set([...Object.keys(allowed.figures), ...Object.keys(current.figures)])
  for (const figure of [...figures].sort()) {
    const was = allowed.figures[figure]?.distinct ?? 0
    const now = current.figures[figure]?.distinct ?? 0
    if (now > was) {
      const added = Object.keys(current.figures[figure].values).filter((v) => !(v in (allowed.figures[figure]?.values ?? {})))
      grew.push(`${id} ${figure}: ${now} distinct, allowance ${was}${added.length ? ` (new: ${added.join(", ")})` : ""}`)
    } else if (now < was) {
      lowered.push(`${id} ${figure}: ${now} distinct, allowance ${was}`)
    }
  }
  for (const [key, label] of [
    ["crowded", "routes with more than one filled primary"],
    ["dock", "routes where the corner covers a control"],
    ["tiles", "routes with a list drawn as tiles"],
  ]) {
    // A figure the allowance never recorded is not gated yet: a reading taken
    // before the census counted it would otherwise make its first count "growth".
    if (!(key in allowed)) continue
    const was = Object.keys(allowed[key]).length
    const now = Object.keys(current[key]).length
    if (now > was) {
      const added = Object.keys(current[key]).filter((r) => !(r in (allowed[key] ?? {})))
      grew.push(`${id} ${label}: ${now}, allowance ${was}${added.length ? ` (new: ${added.join(", ")})` : ""}`)
    } else if (now < was) {
      lowered.push(`${id} ${label}: ${now}, allowance ${was}`)
    }
  }
  return { grew, lowered: Object.keys(holes).length > 0 ? [] : lowered }
}

/**
 * Why a view did not measure a route (VDS193): the page failed to load or left
 * the walk, it was read but its title moved between the two reads, or no reading
 * of it carries this name.
 */
export function whyMissing(route, view, readings, failures) {
  const failure = failures.find((f) => f.route === route && f.view === view)
  if (failure) return failure.error
  if (readings.some((r) => r.route === route && r.view === view)) return "the title offset differed between the two reads"
  return "no reading in this view carries this route's name"
}

/** One line per view with gaps, naming each route it did not measure and why. */
export function describeGaps(id, holes, readings = [], failures = []) {
  return Object.entries(holes).map(([view, routes]) => {
    const named = routes.map((route) => `${route}: ${whyMissing(route, view, readings, failures)}`)
    return `${id} ${view}: ${routes.length} route(s) not measured (${named.join("; ")})`
  })
}

// ---------------------------------------------------------------------------
// The walk

function parsePairs(args, flag) {
  const out = {}
  args.forEach((arg, i) => {
    if (arg !== flag) return
    const pair = args[i + 1] ?? ""
    const at = pair.indexOf("=")
    if (at > 0) out[pair.slice(0, at)] = pair.slice(at + 1)
  })
  return out
}

async function walkConsumer(chromium, start, auth, log) {
  const origin = new URL(start).origin
  const authorization = auth ? `Basic ${Buffer.from(auth).toString("base64")}` : null
  const browser = await chromium.launch()
  const known = new Set()
  const classify = makeClassifier(async (url) => {
    try {
      const res = await fetch(`${url}.map`, { headers: authorization ? { authorization } : {} })
      return res.ok ? await res.json() : null
    } catch {
      return null
    }
  })

  async function contextFor(view) {
    const context = await browser.newContext({
      viewport: { width: view.width, height: view.height },
      colorScheme: view.theme,
      // bento.css turns every entry animation off under reduced motion, so a
      // page is read at rest rather than part-way through a stagger (VDS188).
      reducedMotion: "reduce",
    })
    if (authorization) {
      await context.route(`${origin}/**`, (route) =>
        route.continue({ headers: { ...route.request().headers(), authorization } }),
      )
    }
    // The theme key is the product's own; read it off the first load and set it.
    const page = await context.newPage()
    await page.goto(start, { waitUntil: "networkidle", timeout: 30000 })
    await page.evaluate((theme) => {
      const keys = Object.keys(localStorage).filter((k) => /theme/i.test(k))
      for (const key of keys.length > 0 ? keys : ["vite-ui-theme"]) localStorage.setItem(key, theme)
    }, view.theme)
    return { context, page }
  }

  /** Fonts loaded, nothing finite animating, and the layout still for three frames. */
  async function settle(page) {
    await page.evaluate(async () => {
      await document.fonts.ready
      const frame = () => new Promise((done) => requestAnimationFrame(() => done()))
      const deadline = performance.now() + 3000
      let last = ""
      let still = 0
      while (still < 3 && performance.now() < deadline) {
        await frame()
        const moving = document
          .getAnimations()
          .filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity).length
        const shape = `${document.body.scrollHeight}:${document.body.getElementsByTagName("*").length}:${moving}`
        still = moving === 0 && shape === last ? still + 1 : 0
        last = shape
      }
      // Focus left on whatever the page autofocused paints a ring and a state.
      document.activeElement?.blur?.()
    })
  }

  async function read(page, url, view) {
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 })
    } catch (error) {
      return { error: `load: ${String(error.message).split("\n")[0]}` }
    }
    if (!walkable(page.url(), start)) return { error: `left the walk for ${new URL(page.url()).pathname}` }
    await settle(page)
    const raw = await page.evaluate(probe)
    await page.waitForTimeout(400)
    await settle(page)
    const again = await page.evaluate(probe)
    for (const pattern of raw.patterns) known.add(pattern)
    const ownersOf = (read) => Promise.all(read.chains.map((chain) => ownerOf(chain, read.stacks, classify)))
    const [owners, ownersAgain] = await Promise.all([ownersOf(raw), ownersOf(again)])
    const ownerAt = (i) => (i >= 0 ? owners[i] : "unknown")
    const agreed = agree(raw.samples, again.samples)
    // A route figure is the lower of the two reads: what was there both times.
    const overlaps =
      again.overlaps.length < raw.overlaps.length
        ? again.overlaps.map((i) => (i >= 0 ? ownersAgain[i] : "unknown"))
        : raw.overlaps.map(ownerAt)
    return {
      reading: {
        // Named once the walk ends, against every pattern the views found (VDS193).
        route: null,
        path: raw.path,
        match: raw.current,
        view: view.id,
        dark: raw.dark,
        samples: agreed.samples.map(([figure, value, chain]) => ({ figure, value, owner: ownerAt(chain) })),
        primaries: Math.min(raw.primaries, again.primaries),
        overlaps,
        tiles: Math.min(raw.tileLists, again.tileLists),
        mosaics: raw.mosaics.map(ownerAt).filter((owner) => owner === "package").length,
        unstable: agreed.unstable,
      },
      links: raw.links,
    }
  }

  try {
    // The first view walks: every route it reaches adds its links to the queue.
    const [first, ...rest] = VIEWS
    const { context, page } = await contextFor(first)
    if (!walkable(page.url(), start)) {
      return { error: `the start page went to ${new URL(page.url()).pathname}; pass --auth if it signs in` }
    }
    // Queued by route, so a route reached twice (a list linking forty users) is read once.
    const routes = new Map()
    const readings = []
    const failures = []
    const queue = []
    const offer = (href) => {
      if (routes.size >= MAX_ROUTES || !walkable(href, start)) return
      const url = new URL(href, start)
      url.hash = ""
      const route = routeOf(url.pathname, known)
      if (routes.has(route)) return
      routes.set(route, url.href)
      queue.push(url.href)
    }
    offer(start)
    while (queue.length > 0) {
      const url = queue.shift()
      const result = await read(page, url, first)
      if (result.error) {
        failures.push({ path: new URL(url).pathname, view: first.id, error: result.error })
        continue
      }
      readings.push(result.reading)
      log(`  ${first.id} ${result.reading.path}`)
      // The router's static routes are seeds; a route with a param is reached through a link.
      for (const pattern of [...known].sort()) {
        if (!pattern.includes(":") && !pattern.includes("*")) offer(`${origin}${pattern}`)
      }
      for (const href of result.links) offer(href)
    }
    await context.close()

    await Promise.all(
      rest.map(async (view) => {
        const { context: other, page: otherPage } = await contextFor(view)
        for (const url of routes.values()) {
          const result = await read(otherPage, url, view)
          if (result.error) failures.push({ path: new URL(url).pathname, view: view.id, error: result.error })
          else readings.push(result.reading)
        }
        await other.close()
      }),
    )
    // The crawl read a page while the pattern set was still growing, so a name
    // given then could fold a path the other views name by its pattern.
    for (const r of readings) r.route = nameRoute(r.path, r.match, known)
    const failed = failures.map((f) => ({ route: routeOf(f.path, known), view: f.view, error: f.error }))
    return {
      routes: [...new Set(readings.map((r) => r.route))].sort(),
      readings,
      failures: failed,
      errors: failed.map((f) => `${f.route} (${f.view}): ${f.error}`),
    }
  } finally {
    await browser.close()
  }
}

function printConsumer(id, walked, tallied) {
  console.log(`\n${id}: ${walked.routes.length} route(s) × ${VIEWS.length} view(s) (${VIEWS.map((v) => v.id).join(", ")})`)
  const byRoute = new Map()
  for (const r of walked.readings) {
    const row = byRoute.get(r.route) ?? { title: {}, heights: new Set(), inputs: new Set(), radii: new Set(), mono: new Set(), primaries: 0, dock: 0, wrongTheme: 0 }
    for (const s of r.samples) {
      if (s.figure === "title-x") row.title[r.view] = s.value
      if (s.figure === "button-height") row.heights.add(Number(s.value))
      if (s.figure === "input-height") row.inputs.add(Number(s.value))
      if (s.figure === "radius") row.radii.add(s.value)
      if (s.figure === "mono") row.mono.add(s.value)
    }
    row.primaries = Math.max(row.primaries, r.primaries)
    row.dock = Math.max(row.dock, r.overlaps.length)
    if (r.dark !== (VIEWS.find((v) => v.id === r.view)?.theme === "dark")) row.wrongTheme++
    byRoute.set(r.route, row)
  }
  const nums = (set) => [...set].sort((a, b) => a - b).join(" ") || "-"
  console.log(`  ${"route".padEnd(40)} ${"title x".padEnd(14)} ${"buttons".padEnd(24)} ${"inputs".padEnd(10)} radii mono primary dock`)
  for (const [route, row] of [...byRoute].sort(([a], [b]) => a.localeCompare(b))) {
    const title = VIEWS.map((v) => row.title[v.id] ?? "?").join("/")
    const flag = row.wrongTheme > 0 ? "  (theme did not apply)" : ""
    console.log(
      `  ${route.padEnd(40)} ${title.padEnd(14)} ${nums(row.heights).padEnd(24)} ${nums(row.inputs).padEnd(10)} ${String(row.radii.size).padStart(5)} ${String(row.mono.size).padStart(4)} ${String(row.primaries).padStart(7)} ${String(row.dock).padStart(4)}${flag}`,
    )
  }
  const allowance = allowanceOf(tallied)
  console.log(`\n  ${"figure".padEnd(26)} distinct  package  product  unknown`)
  for (const [figure, f] of Object.entries(allowance.figures)) {
    console.log(`  ${figure.padEnd(26)} ${String(f.distinct).padStart(8)} ${String(f.byOwner.package).padStart(8)} ${String(f.byOwner.product).padStart(8)} ${String(f.byOwner.unknown).padStart(8)}`)
  }
  console.log(`  routes with more than one filled primary: ${Object.keys(allowance.crowded).length}`)
  console.log(`  routes where the corner covers a control: ${Object.keys(allowance.dock).length}`)
  const tileRoutes = Object.keys(allowance.tiles)
  console.log(`  routes with a list drawn as tiles: ${tileRoutes.length}${tileRoutes.length ? ` (${tileRoutes.join(", ")})` : ""}`)
  if (unmarked(walked.readings)) {
    console.log("  (the package mosaics here carry no list marker: this consumer installs a release before it, so the tile count reads 0)")
  }
  const unstable = [...new Set(walked.readings.flatMap((r) => r.unstable ?? []))].sort()
  if (unstable.length > 0) {
    console.log(`  unstable, seen in one of two reads and not counted: ${unstable.length}`)
    for (const value of unstable.slice(0, 12)) console.log(`    ${value}`)
  }
  for (const error of walked.errors) console.log(`  not read: ${error}`)
}

/** Whether a consumer's mosaics predate the list marker, so its tile count is not one. */
export function unmarked(readings) {
  return readings.some((r) => (r.mosaics ?? 0) > 0) && !readings.some((r) => (r.tiles ?? 0) > 0)
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const args = process.argv.slice(2)
  const register = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8"))
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version
  const allowancePath = join(root, "look-allowance.json")
  const allowance = existsSync(allowancePath)
    ? JSON.parse(readFileSync(allowancePath, "utf8"))
    : { why: [], consumers: {} }

  const urls = parsePairs(args, "--url")
  const auths = parsePairs(args, "--auth")
  const bento = register.consumers.filter((c) => c.chrome === "bento").map((c) => c.id)
  const unknown = Object.keys(urls).filter((id) => !bento.includes(id))
  if (unknown.length > 0) {
    console.error(`look-census: not a bento consumer in consumers.json: ${unknown.join(", ")}`)
    process.exit(2)
  }

  const { chromium } = await import("playwright")
  const json = args.includes("--json")
  const log = json ? () => {} : (line) => process.stderr.write(`${line}\n`)
  const out = {}
  const grew = []
  const lowered = []
  const incomplete = []
  for (const id of bento) {
    const start = urls[id]
    if (!start) {
      out[id] = { measured: false, reason: "no --url named a running dev server for it" }
      continue
    }
    log(`${id}: walking ${start}`)
    const walked = await walkConsumer(chromium, start, auths[id] ?? process.env.LOOK_CENSUS_AUTH ?? null, log)
    if (walked.error) {
      out[id] = { measured: false, reason: walked.error }
      continue
    }
    // Figures are counted over the routes every view measured (VDS189).
    const holes = gaps(walked.readings)
    const tallied = tally(complete(walked.readings))
    const reading = allowanceOf(tallied)
    out[id] = { measured: true, routes: walked.routes, errors: walked.errors, gaps: holes, ...reading, readings: walked.readings }
    const allowed = allowance.consumers[id]
    if (allowed?.figures) {
      const result = compare(id, allowed, reading, holes)
      grew.push(...result.grew)
      lowered.push(...result.lowered)
    }
    incomplete.push(...describeGaps(id, holes, walked.readings, walked.failures))
    if (!json) printConsumer(id, walked, tallied)
  }

  if (json) {
    console.log(JSON.stringify(out, null, 2))
  } else {
    const missing = bento.filter((id) => !out[id].measured)
    for (const id of missing) console.log(`\n${id}: not measured (${out[id].reason})`)
  }

  for (const line of incomplete) console.error(`  incomplete: ${line}`)
  if (incomplete.length > 0) {
    console.error("  figures were compared over the routes every view measured; nothing is offered as lowered")
  }

  if (args.includes("--write")) {
    // A partial reading written as the allowance fails the next complete run.
    if (incomplete.length > 0) {
      console.error("look-census: not written, since a view has routes it did not measure")
      process.exit(2)
    }
    const today = new Date().toISOString().slice(0, 10)
    for (const id of bento) {
      const reading = out[id]
      if (reading.measured) {
        allowance.consumers[id] = {
          measured: today,
          package: version,
          views: VIEWS.map((v) => v.id),
          routes: reading.routes.length,
          figures: reading.figures,
          crowded: reading.crowded,
          dock: reading.dock,
          // Package mosaics with no list marker mean a release before VDS187, whose
          // zero is not a count; leaving the key out leaves the figure ungated.
          ...(unmarked(reading.readings) ? {} : { tiles: reading.tiles }),
        }
      } else if (!allowance.consumers[id]?.figures) {
        allowance.consumers[id] = { measured: null, reason: reading.reason }
      }
    }
    allowance.consumers = Object.fromEntries(Object.entries(allowance.consumers).sort(([a], [b]) => a.localeCompare(b)))
    writeFileSync(allowancePath, `${JSON.stringify(allowance, null, 2)}\n`)
    console.error(`look-census: wrote ${allowancePath}`)
  } else {
    for (const line of lowered) console.error(`  lowered: ${line} (run --write to record it)`)
    for (const line of grew) console.error(`  grew: ${line}`)
    if (grew.length > 0) process.exit(1)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
