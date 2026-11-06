/// <reference lib="dom" />
// The scripts are checked against Node's types; this one mounts into jsdom.
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"

import * as React19 from "react"
import * as ReactDOM19 from "react-dom"
import * as ReactDOMClient19 from "react-dom/client"
import { build, type Rollup } from "vite"
import { afterEach, beforeAll, describe, expect, it } from "vitest"

import { GLOBAL_BUILD, moduleLoads } from "./lib/global-build.mjs"

// VDS237 — the browser build, loaded the way a page with no bundler loads it.
//
// The IIFE is built in memory from the real config and evaluated with React and
// ReactDOM as the only globals it is given, once with React 18 from its UMD
// files (a page's `<script src>`, kept under fixtures/ because installing a
// second React re-pointed every Radix peer at it) and once with React 19, which
// ships no UMD and is assembled into the same two globals as a page does.

const root = resolve(import.meta.dirname, "..")
const fixtures = join(import.meta.dirname, "fixtures", "react-18")

type Globals = { React: typeof React19; ReactDOM: typeof ReactDOM19 & typeof ReactDOMClient19 }
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the IIFE's namespace is untyped by construction
type VigletDS = Record<string, any>

let code = ""

beforeAll(async () => {
  const output = (await build({
    configFile: join(root, "vite.global.config.ts"),
    logLevel: "silent",
    build: { write: false },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[]
  const chunks = (Array.isArray(output) ? output[0] : output).output
  const file = chunks.find((c) => c.fileName === GLOBAL_BUILD.file)
  if (!file || file.type !== "chunk") throw new Error(`the build emitted no ${GLOBAL_BUILD.file}`)
  code = file.code
}, 120_000)

/** React 18 from its UMD files, exactly as two `<script>` tags would leave it. */
function react18(): Globals {
  const page: Partial<Globals> = {}
  for (const file of ["react.production.min.js", "react-dom.production.min.js"]) {
    // No `exports`, `module` or `define`, so the UMD wrapper takes its global
    // branch. It runs strict, where `this` is undefined, and falls back to
    // `self`, which is this page rather than the test's window.
    new Function("exports", "module", "define", "self", readFileSync(join(fixtures, file), "utf8"))(
      undefined,
      undefined,
      undefined,
      page,
    )
  }
  return page as Globals
}

function react19(): Globals {
  return { React: React19, ReactDOM: { ...ReactDOM19, ...ReactDOMClient19 } }
}

/** Runs the script with these globals and nothing else, and returns `VigletDS`. */
function load({ React, ReactDOM }: Globals): VigletDS {
  return new Function("React", "ReactDOM", `${code}\nreturn ${GLOBAL_BUILD.name}`)(React, ReactDOM)
}

const unmounts: Array<() => void> = []
afterEach(() => {
  for (const unmount of unmounts.splice(0)) unmount()
  document.documentElement.lang = ""
})

function mount({ React, ReactDOM }: Globals, element: React19.ReactElement) {
  const container = document.createElement("div")
  document.body.append(container)
  const root = ReactDOM.createRoot(container)
  // React 19 here is the development build, which asks for act() and for the
  // flag Testing Library sets only inside its own; React 18's production UMD has
  // no act and no warning to give.
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  const commit = (fn: () => void) => {
    if (React.version.startsWith("18")) return ReactDOM.flushSync(fn)
    const before = g.IS_REACT_ACT_ENVIRONMENT
    g.IS_REACT_ACT_ENVIRONMENT = true
    try {
      React.act(fn)
    } finally {
      g.IS_REACT_ACT_ENVIRONMENT = before
    }
  }
  commit(() => root.render(element))
  unmounts.push(() => commit(() => root.unmount()))
  return container
}

describe("the browser build", () => {
  it("loads nothing by module, so a classic script can run it", () => {
    expect(moduleLoads(code)).toEqual([])
  })

  it("publishes every component GLOBAL_BUILD names, which the canvas cards are made from", () => {
    const ds = load(react19())
    for (const name of GLOBAL_BUILD.components) expect(typeof ds[name], name).not.toBe("undefined")
  })

  it("carries nothing that would end an inline <script>", () => {
    // A design canvas inlines the bundle; either sequence would cut it short.
    expect(code).not.toContain("</script")
    expect(code).not.toContain("<!--")
  })

  for (const [name, globals] of [
    ["React 18", react18],
    ["React 19", react19],
  ] as const) {
    describe(`under ${name}`, () => {
      it("mounts Button and Badge from window.VigletDS", () => {
        const page = globals()
        expect(page.React.version.slice(0, 2)).toBe(name.slice(-2))
        const ds = load(page)
        const h = page.React.createElement

        const container = mount(
          page,
          h("div", null, h(ds.Button, { variant: "outline" }, "Save"), h(ds.Badge, null, "New")),
        )

        const button = container.querySelector('[data-slot="button"]')
        expect(button?.tagName).toBe("BUTTON")
        expect(button?.textContent).toBe("Save")
        expect(container.querySelector('[data-slot="badge"]')?.textContent).toBe("New")
      })

      it("draws the status marker's words from the page's language", () => {
        document.documentElement.lang = "pt-BR"
        const page = globals()
        const ds = load(page)
        const h = page.React.createElement

        const container = mount(page, h(ds.BentoStatusMarker, { state: "published" }))
        expect(container.textContent).toBe("Publicado")
      })

      it("renders every component it publishes", () => {
        const page = globals()
        const ds = load(page)
        const h = page.React.createElement
        const container = mount(
          page,
          h(
            ds.Card,
            null,
            h(ds.CardHeader, null, h(ds.CardTitle, null, "Title")),
            h(ds.CardContent, null, h(ds.Input, { defaultValue: "a" }), h(ds.Textarea, null)),
            h(ds.Tabs, { defaultValue: "a" }, h(ds.TabsList, null, h(ds.TabsTrigger, { value: "a" }, "A")), h(ds.TabsContent, { value: "a" }, "Panel")),
            h(ds.Switch, null),
            h(ds.Checkbox, null),
            h(ds.Progress, { value: 40 }),
            h(ds.Separator, null),
            h(ds.Avatar, null, h(ds.AvatarFallback, null, "AO")),
            h(ds.GradientButton, null, "Go"),
          ),
        )
        expect(container.textContent).toContain("Panel")
        expect(container.querySelector('[role="switch"]')).not.toBeNull()
        expect(container.querySelector('[role="checkbox"]')).not.toBeNull()
        expect(container.querySelector('[role="tab"]')?.textContent).toBe("A")
      })
    })
  }
})
