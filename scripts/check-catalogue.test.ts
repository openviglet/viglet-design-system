import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { readUndescribed, undescribedFindings } from "./check-catalogue.mjs"

// VDS150 — a purpose the catalogue can serve is a doc comment somebody wrote, so
// the gate holds the count of undescribed components to a list that only shrinks.

const root = resolve(import.meta.dirname, "..")

const component = (name: string, summary = "") => ({ name, summary })

describe("the undescribed list", () => {
  it("reads one name a line, dropping comments and blank lines", () => {
    expect(readUndescribed("# why\n\nAccordion\r\n  Avatar  \n# more\n")).toEqual(["Accordion", "Avatar"])
  })

  it("passes a described component and a listed undescribed one", () => {
    expect(undescribedFindings([component("BentoPanel", "A frosted box."), component("Accordion")], ["Accordion"])).toEqual([])
  })

  it("fails a new component that arrives without a doc comment", () => {
    expect(undescribedFindings([component("BentoNew")], [])).toEqual([
      expect.stringMatching(/^BentoNew has no doc comment/),
    ])
  })

  it("fails a listed component that has been described, so the list shrinks with it", () => {
    expect(undescribedFindings([component("Accordion", "A stack of collapsible sections.")], ["Accordion"])).toEqual([
      expect.stringMatching(/^Accordion is described now: remove it/),
    ])
  })

  it("fails a listed name that is no longer a component", () => {
    expect(undescribedFindings([], ["Gone"])).toEqual([expect.stringMatching(/^Gone is in catalogue-undescribed.txt but is not/)])
  })

  it("keeps the committed list sorted and free of repeats, so an edit to it reads as one line", () => {
    const listed = readUndescribed(readFileSync(join(root, "catalogue-undescribed.txt"), "utf8"))
    expect(listed).toEqual([...new Set(listed)].sort((a, b) => a.localeCompare(b)))
  })
})
