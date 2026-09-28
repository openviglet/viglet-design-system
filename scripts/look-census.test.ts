import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  allowanceOf,
  compare,
  decodeMappings,
  fits,
  makeClassifier,
  ownerOf,
  routeOf,
  routePattern,
  sourceAt,
  tally,
  walkable,
  type Reading,
} from "./look-census.mjs"

// VDS180 — the look census. The walk itself needs a running consumer and a
// browser, so it is exercised by hand; what it computes from a page is held here,
// and the committed allowance is held to the register.

const root = resolve(import.meta.dirname, "..")

describe("naming a route", () => {
  it("folds id-shaped segments when no router pattern is known", () => {
    expect(routePattern("/bento/admin/users/42")).toBe("/bento/admin/users/:id")
    expect(routePattern("/bento/content/object/5165d9d5-6d1e-4813-bdbe-4fa16ee69757")).toBe("/bento/content/object/:id")
    expect(routePattern("/bento/admin/exchange-providers")).toBe("/bento/admin/exchange-providers")
    expect(routePattern("/")).toBe("/")
  })

  it("takes the most specific router pattern, so a username never names a route", () => {
    const patterns = ["/bento/*", "/bento/admin/users", "/bento/admin/users/:userId", "/bento/admin/users/new"]
    expect(routeOf("/bento/admin/users/admin", patterns)).toBe("/bento/admin/users/:userId")
    expect(routeOf("/bento/admin/users/new", patterns)).toBe("/bento/admin/users/new")
    expect(routeOf("/bento/admin/users/", patterns)).toBe("/bento/admin/users")
    // A splat fits everything under it and names nothing.
    expect(routeOf("/bento/elsewhere/7", patterns)).toBe("/bento/elsewhere/:id")
  })

  it("fits a param to one segment and a splat to the rest", () => {
    expect(fits("/a/:id", "/a/b")).toBe(true)
    expect(fits("/a/:id", "/a/b/c")).toBe(false)
    expect(fits("/a/*", "/a/b/c")).toBe(true)
    expect(fits("/a/b", "/a")).toBe(false)
  })

  it("walks same-origin links under the start path, and never a sign-out", () => {
    const start = "http://localhost:5173/bento"
    expect(walkable("/bento/admin/users", start)).toBe(true)
    expect(walkable("http://localhost:5173/bento", start)).toBe(true)
    expect(walkable("/bentobox", start)).toBe(false)
    expect(walkable("/login", start)).toBe(false)
    expect(walkable("/bento/logout", start)).toBe(false)
    expect(walkable("/bento/files/report.pdf", start)).toBe(false)
    expect(walkable("https://example.com/bento", start)).toBe(false)
  })
})

describe("attributing an element", () => {
  it("decodes source map segments across lines", () => {
    // Line 1: column 0 in source 0, column 2 in source 1. Line 2 keeps source 1;
    // line 3 steps back to source 0 (`D` is -1).
    const decoded = decodeMappings("AAAA,ECAA;AAAA;ADAA")
    const map = { sources: ["a.js", "b.js"] }
    expect(sourceAt(map, decoded, 1, 1)).toBe("a.js")
    expect(sourceAt(map, decoded, 1, 3)).toBe("b.js")
    expect(sourceAt(map, decoded, 2, 1)).toBe("b.js")
    expect(sourceAt(map, decoded, 3, 5)).toBe("a.js")
    expect(sourceAt(map, decoded, 9, 1)).toBeNull()
  })

  const DEPS = "http://localhost:5173/node_modules/.vite/deps"
  const maps: Record<string, { sources: string[]; mappings: string }> = {
    [`${DEPS}/user.context-D3kmD3_y-Bg.js`]: {
      sources: ["../../@viglet/viglet-design-system/dist/user.context-D3kmD3_y.js"],
      mappings: "AAAA",
    },
    [`${DEPS}/chunk-radix.js`]: { sources: ["../../@radix-ui/react-slot/dist/index.mjs"], mappings: "AAAA" },
    [`${DEPS}/chunk-react.js`]: { sources: ["../../react/cjs/react-jsx-runtime.development.js"], mappings: "AAAA" },
  }
  const classify = makeClassifier(async (url) => maps[url] ?? null)
  const frame = (url: string) => ({ url, line: 1, column: 1 })

  it("reads a frame as package, product, React or third-party", async () => {
    expect(await classify(frame(`${DEPS}/@viglet_viglet-design-system_bento.js?v=1`))).toBe("package")
    expect(await classify(frame("http://localhost:5173/@fs/D:/Git/viglet/viglet-design-system/2026.3/dist/bento.es.js"))).toBe("package")
    expect(await classify(frame("http://localhost:5173/src/pages/users.tsx?t=1"))).toBe("product")
    expect(await classify(frame(`${DEPS}/react_jsx-runtime.js?v=1`))).toBe("react")
    // A shared chunk is named by the file it came from, so its map decides.
    expect(await classify(frame(`${DEPS}/user.context-D3kmD3_y-Bg.js?v=1`))).toBe("package")
    expect(await classify(frame(`${DEPS}/chunk-radix.js?v=1`))).toBe("third")
    expect(await classify(frame(`${DEPS}/chunk-react.js?v=1`))).toBe("react")
    expect(await classify(frame(`${DEPS}/no-map.js`))).toBe("third")
  })

  it("hands a third-party frame to the owner, and skips React's own frames", async () => {
    const stacks = [
      [frame(`${DEPS}/react_jsx-runtime.js`), frame(`${DEPS}/chunk-radix.js`)],
      [frame(`${DEPS}/react_jsx-runtime.js`), frame(`${DEPS}/@viglet_viglet-design-system.js`)],
      [frame("http://localhost:5173/src/app.tsx")],
    ]
    expect(await ownerOf([0, 1, 2], stacks, classify)).toBe("package")
    expect(await ownerOf([0, 2], stacks, classify)).toBe("product")
    expect(await ownerOf([0], stacks, classify)).toBe("unknown")
    expect(await ownerOf([], stacks, classify)).toBe("unknown")
  })
})

describe("the allowance", () => {
  const reading = (route: string, view: string, samples: [string, string, Reading["samples"][number]["owner"]][], extra: Partial<Reading> = {}): Reading => ({
    route,
    view,
    samples: samples.map(([figure, value, owner]) => ({ figure, value, owner })),
    primaries: 1,
    overlaps: [],
    ...extra,
  })

  const first = [
    reading("/a", "desktop-dark", [["button-height", "36", "package"], ["button-height", "36", "package"], ["title-x", "188", "package"]]),
    reading("/b", "desktop-dark", [["button-height", "44", "product"], ["title-x", "380", "package"]], { primaries: 3 }),
    reading("/b", "phone-dark", [["title-x", "60", "package"]], { overlaps: ["product"] }),
  ]

  it("splits each figure by owner and names the routes off the common value", () => {
    const allowance = allowanceOf(tally(first))
    expect(allowance.figures["button-height"]).toEqual({
      distinct: 2,
      byOwner: { package: 1, product: 1, unknown: 0 },
      values: { "36": { package: 2, product: 0, unknown: 0 }, "44": { package: 0, product: 1, unknown: 0 } },
      offenders: { "44": ["/b"] },
    })
    // The title is read per view: a phone moving it is not drift.
    expect(allowance.figures["title-x@desktop-dark"].distinct).toBe(2)
    expect(allowance.figures["title-x@phone-dark"].distinct).toBe(1)
    expect(allowance.crowded).toEqual({ "/b": 3 })
    expect(allowance.dock).toEqual({ "/b": 1 })
  })

  it("fails a reading that grows a figure and reports one that lowers it", () => {
    const allowed = allowanceOf(tally(first))
    const worse = allowanceOf(
      tally([...first, reading("/c", "desktop-dark", [["button-height", "40", "product"]], { overlaps: ["package"] })]),
    )
    const better = allowanceOf(tally([first[0], reading("/b", "desktop-dark", [["title-x", "188", "package"]])]))

    expect(compare("shio", allowed, allowed)).toEqual({ grew: [], lowered: [] })
    expect(compare("shio", allowed, worse).grew).toEqual([
      "shio button-height: 3 distinct, allowance 2 (new: 40)",
      "shio routes where the corner covers a control: 2, allowance 1 (new: /c)",
    ])
    const { grew, lowered } = compare("shio", allowed, better)
    expect(grew).toEqual([])
    expect(lowered).toContain("shio button-height: 1 distinct, allowance 2")
    expect(lowered).toContain("shio routes with more than one filled primary: 0, allowance 1")
  })

  it("names the routes drawing a list as tiles, and gates the count once recorded", () => {
    const withTiles = [
      reading("/users", "desktop-dark", [["button-height", "36", "package"]], { tiles: 1 }),
      reading("/users", "phone-dark", [["button-height", "36", "package"]], { tiles: 1 }),
      reading("/media", "desktop-dark", [["button-height", "36", "package"]], { tiles: 2 }),
      reading("/roles", "desktop-dark", [["button-height", "36", "package"]], { tiles: 0 }),
    ]
    const allowance = allowanceOf(tally(withTiles))
    expect(allowance.tiles).toEqual({ "/media": 2, "/users": 1 })

    const moved = allowanceOf(tally(withTiles.filter((r) => r.route !== "/users")))
    expect(compare("shio", allowance, moved).lowered).toContain("shio routes with a list drawn as tiles: 1, allowance 2")
    const more = allowanceOf(tally([...withTiles, reading("/roles", "desktop-dark", [], { tiles: 1 })]))
    expect(compare("shio", allowance, more).grew).toContain("shio routes with a list drawn as tiles: 3, allowance 2 (new: /roles)")

    // A reading recorded before the census counted tiles does not gate the count.
    const { tiles: _unrecorded, ...older } = allowance
    expect(compare("shio", older, more).grew).toEqual([])
  })

  it("holds every bento consumer, measured or with the reason it was not", () => {
    const register = JSON.parse(readFileSync(join(root, "consumers.json"), "utf8")) as {
      consumers: { id: string; chrome: string }[]
    }
    const recorded = JSON.parse(readFileSync(join(root, "look-allowance.json"), "utf8")) as {
      consumers: Record<string, { measured: string | null; reason?: string; figures?: Record<string, unknown> }>
    }
    const bento = register.consumers.filter((c) => c.chrome === "bento").map((c) => c.id)
    expect(Object.keys(recorded.consumers).sort()).toEqual([...bento].sort())
    for (const id of bento) {
      const entry = recorded.consumers[id]
      if (entry.measured) expect(entry.figures, id).toBeDefined()
      else expect(entry.reason, id).toMatch(/\S/)
    }
    // The first reading is Shio's; the rest wait for a running console.
    expect(recorded.consumers.shio.measured).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
