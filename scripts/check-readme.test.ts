import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { covered, findings, inventory, moduleOf, namesIn, ships } from "./check-readme.mjs"

// VDS158 — the README's inventory against the surface it describes. The gate
// itself runs in `npm run build`, where `dist/exports.json` has just been
// emitted; what is held here is the reading, over a README written for the
// purpose, because the rules are where this can be wrong quietly.

const root = resolve(import.meta.dirname, "..")

/** Enough names to clear the floors, so a fixture tests a rule and not a floor. */
const filler = Array.from({ length: 120 }, (_, i) => `Filler${i}`)

/** Filler declares each name in a module of its own, so it heads no family. */
const fillerModules = Object.fromEntries(filler.map((name) => [name, `ui/${name.toLowerCase()}`]))

const surface = (values: string[], router: string[] = [], declaredIn: Record<string, string> = {}) => ({
  entries: {
    ".": {
      values: [...filler, ...values],
      declaredIn: {
        ...fillerModules,
        ...Object.fromEntries(values.map((name) => [name, `ui/${name.toLowerCase()}`])),
        ...declaredIn,
      },
    },
    "./router": {
      values: router,
      declaredIn: Object.fromEntries(router.map((name) => [name, `router/${name.toLowerCase()}`])),
    },
  },
})

const listing = (names: string[], claimed: number | null = null) => [
  { heading: "UI Primitives", names: [...filler, ...names], claimed },
]

describe("reading a list out of the README", () => {
  it("cuts a gloss and keeps the name in front of it", () => {
    expect(namesIn("Toaster (sonner)")).toEqual(["Toaster"])
    expect(namesIn("VigletAssistant ([the dock](#the-assistant-dock))")).toEqual(["VigletAssistant"])
  })

  it("keeps both halves of a pair written with a slash", () => {
    expect(namesIn("`UserProvider` / `useCurrentUser`")).toEqual(["UserProvider", "useCurrentUser"])
  })

  it("takes the first list under each heading and leaves the prose alone", () => {
    const readme = [
      "## What's Included",
      "",
      "### UI Primitives (2 components)",
      "",
      "Accordion, Button",
      "",
      "`Accordion` is a vertical stack of headed sections, each expanding to show its content.",
      "",
      "### App Components",
      "",
      "AppFooter, ModeToggle",
      "",
      "Removed with the console era — see [where each went](#x): BlankSlate, GridList",
      "",
      "## Development",
      "",
      "Run, build, test",
    ].join("\n")

    expect(inventory(readme)).toEqual([
      { heading: "UI Primitives (2 components)", names: ["Accordion", "Button"], claimed: 2 },
      { heading: "App Components", names: ["AppFooter", "ModeToggle"], claimed: null },
    ])
  })

  it("reads no list out of a sentence that happens to hold commas", () => {
    const readme = [
      "## What's Included",
      "",
      "### Design Tokens",
      "",
      "OKLCH-based color system with light/dark mode, CSS variables for theming, chart palette.",
    ].join("\n")

    expect(inventory(readme)).toEqual([])
  })
})

describe("a listed name and the family it heads", () => {
  const listed = new Set(["Accordion", "Toast", "Resizable", "Button"])
  const declaredIn = {
    Accordion: "ui/accordion",
    AccordionItem: "ui/accordion",
    Toast: "ui/toast",
    Toaster: "ui/sonner",
    ResizableHandle: "ui/resizable",
    ResizablePanel: "ui/resizable",
    Button: "ui/button",
    ButtonGroup: "ui/button-group",
  }

  it("covers a part declared in the same module as its family head", () => {
    expect(covered("AccordionItem", listed, declaredIn)).toBe(true)
    expect(covered("Accordion", listed, declaredIn)).toBe(true)
  })

  it("does not let a listed name cover a component of its own", () => {
    // VDS160 — the whole point. `ButtonGroup` continues `Button` on a capital,
    // so a prefix reads it as one of Button's parts and the list never has to
    // name it. Its own module is what says it is a component, not a part.
    expect(covered("ButtonGroup", listed, declaredIn)).toBe(false)
  })

  it("does not let one name cover another that merely starts the same way", () => {
    // `Toaster` resumes on a lowercase letter, so `Toast` was never its family
    // even before the module was read — two rules, and either one is enough.
    expect(covered("Toaster", listed, declaredIn)).toBe(false)
  })

  it("reads a heading with no export of its own through the module its parts agree on", () => {
    expect(moduleOf("Resizable", declaredIn)).toBe("ui/resizable")
    expect(covered("ResizableHandle", listed, declaredIn)).toBe(true)
  })

  it("gives no module to a prefix whose parts disagree about theirs", () => {
    // Two families sharing a prefix is exactly what a name-only reader cannot
    // see, so a name standing over both stands for neither.
    expect(moduleOf("Button", { ButtonGroup: "ui/button-group", ButtonBar: "ui/button-bar" })).toBeNull()
  })

  it("reads the other way, for a listed name that no longer names anything", () => {
    const exported = new Set(["ResizableHandle", "ResizablePanel", "Button"])
    expect(ships("Resizable", declaredIn, exported)).toBe(true)
    expect(ships("Button", declaredIn, exported)).toBe(true)
    expect(ships("GridList", {}, exported)).toBe(false)
  })
})

describe("holding the lists to the surface", () => {
  it("says nothing while every exported name is covered", () => {
    // AccordionItem is declared beside Accordion, which is what makes it a part
    // of it rather than a component the list forgot.
    const shipped = surface(["Accordion", "AccordionItem"], [], { AccordionItem: "ui/accordion" })
    expect(findings(listing(["Accordion"]), shipped)).toEqual([])
  })

  it("names a component that only looks like a part of a listed one", () => {
    const shipped = surface(["Accordion", "AccordionSummary"], [], { AccordionSummary: "ui/accordion-summary" })
    expect(findings(listing(["Accordion"]), shipped)).toEqual([
      'AccordionSummary is exported from "." and no list names it',
    ])
  })

  it("names a component the entry ships and no list mentions", () => {
    expect(findings(listing(["Accordion"]), surface(["Accordion", "ErrorBoundary"]))).toEqual([
      'ErrorBoundary is exported from "." and no list names it',
    ])
  })

  it("names a listed component no entry exports any more, which is what a removal leaves", () => {
    expect(findings(listing(["Accordion", "GridList"]), surface(["Accordion"]))).toEqual([
      "UI Primitives names GridList, which no entry exports",
    ])
  })

  it("counts a name shipped from another subpath as shipped", () => {
    // The App Components list names three that come from `./router`, and says so
    // in the sentence under it. Listed-and-unshipped is about a name that is
    // gone, not about which subpath it arrives on.
    expect(findings(listing(["Accordion", "DialogDelete"]), surface(["Accordion"], ["DialogDelete"]))).toEqual([])
  })

  it("holds a heading's count to the list under it", () => {
    const [first] = findings(listing(["Accordion"], 2), surface(["Accordion"]))
    expect(first).toMatch(/lists 121 name\(s\), and its heading claims 2/)
  })

  it("refuses to pass on a reading that found nothing", () => {
    // The failure this file is least likely to notice about itself: a reader
    // that returns nothing agrees with every README, including an empty one.
    expect(findings([], surface(["Accordion"]))[0]).toMatch(/the reader is broken, not the README/)
    expect(findings(listing([]), { entries: { ".": { values: ["Accordion"] } } })[0]).toMatch(
      /exports\.json was not the surface/,
    )
  })

  it("holds only the components to the inventory, and the hooks only to existing", () => {
    // Far more camelCase values are exported than anyone would want listed, so a
    // hooks list is a chosen few. It still cannot name one that has gone.
    const hooks = [{ heading: "Hooks", names: ["useIsMobile"], claimed: null }]
    const sections = [...listing(["Accordion"]), ...hooks]
    expect(findings(sections, surface(["Accordion", "useIsMobile", "useDateLocale"]))).toEqual([])
    expect(findings(sections, surface(["Accordion"]))).toEqual([
      "Hooks names useIsMobile, which no entry exports",
    ])
  })
})

// The build is the gate, and it runs where dist has just been emitted. This is
// the same reading against the real pair when one is there to read.
describe.skipIf(!existsSync(join(root, "dist", "exports.json")))("the README in this checkout", () => {
  const surface = () => JSON.parse(readFileSync(join(root, "dist", "exports.json"), "utf8"))

  it("names every component the root entry exports", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8")
    const sections = inventory(readme)

    expect(sections.length, "no list was read out of What's Included").toBeGreaterThan(2)
    expect(findings(sections, surface())).toEqual([])
  })

  it("carries the declaring module for every component the root entry exports", () => {
    // What `emit-exports` writes, read back: without it the family rule has
    // nothing to compare and every part reads as an unlisted component.
    const { declaredIn, values } = surface().entries["."]
    const components = values.filter((name: string) => /^[A-Z]/.test(name))

    expect(components.every((name: string) => declaredIn[name])).toBe(true)
    expect(declaredIn.Card, "a compound's parts have to agree on a module").toBe(declaredIn.CardHeader)
    expect(declaredIn.Card).not.toBe(declaredIn.Button)
  })
})
