import { existsSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { covered, findings, inventory, namesIn, ships } from "./check-readme.mjs"

// VDS158 — the README's inventory against the surface it describes. The gate
// itself runs in `npm run build`, where `dist/exports.json` has just been
// emitted; what is held here is the reading, over a README written for the
// purpose, because the rules are where this can be wrong quietly.

const root = resolve(import.meta.dirname, "..")

/** Enough names to clear the floors, so a fixture tests a rule and not a floor. */
const filler = Array.from({ length: 120 }, (_, i) => `Filler${i}`)

const surface = (values: string[], router: string[] = []) => ({
  entries: { ".": { values: [...filler, ...values] }, "./router": { values: router } },
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
  const listed = new Set(["Accordion", "Toast", "Resizable"])

  it("covers a part that continues the family on a capital", () => {
    expect(covered("AccordionItem", listed)).toBe(true)
    expect(covered("Accordion", listed)).toBe(true)
  })

  it("does not let one name cover another that merely starts the same way", () => {
    // The rule that separates a compound's parts from a different component:
    // `Toaster` resumes on a lowercase letter, so `Toast` is not its family.
    expect(covered("Toaster", listed)).toBe(false)
  })

  it("reads the other way for a heading with no export of its own", () => {
    const exported = new Set(["ResizableHandle", "ResizablePanel", "Button"])
    expect(ships("Resizable", exported)).toBe(true)
    expect(ships("Button", exported)).toBe(true)
    expect(ships("Drawer", exported)).toBe(false)
  })
})

describe("holding the lists to the surface", () => {
  it("says nothing while every exported name is covered", () => {
    expect(findings(listing(["Accordion"]), surface(["Accordion", "AccordionItem"]))).toEqual([])
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
  it("names every component the root entry exports", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8")
    const exports = JSON.parse(readFileSync(join(root, "dist", "exports.json"), "utf8"))
    const sections = inventory(readme)

    expect(sections.length, "no list was read out of What's Included").toBeGreaterThan(2)
    expect(findings(sections, exports)).toEqual([])
  })
})
