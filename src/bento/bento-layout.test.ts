import { describe, expect, it } from "vitest"

import {
  BENTO_EMPHASIS_NEXT,
  BENTO_EMPHASIS_SPAN,
  resolveBentoLayout,
  toBentoLayoutEntries,
  type BentoLayoutEntry,
} from "./bento-layout"

// The module's own doc comment says keeping the resolver pure makes it
// unit-testable, and in the product it never was. It decides what a user sees
// after they rearrange a list, so the cases that matter are the ones where the
// saved layout and the current data disagree: an item created since the layout
// was saved, an entry for an item that no longer exists, a tie in displayOrder.

interface Item {
  id: string
}

const items = (...ids: string[]): Item[] => ids.map((id) => ({ id }))
const key = (item: Item) => item.id
const entry = (
  itemId: string,
  displayOrder: number,
  emphasis: BentoLayoutEntry["emphasis"] = "MEDIUM",
): BentoLayoutEntry => ({ itemId, emphasis, displayOrder })

describe("resolveBentoLayout", () => {
  it("features the first item and widens the rest when nothing is persisted", () => {
    const resolved = resolveBentoLayout(items("a", "b", "c"), key, undefined)

    expect(resolved.map((r) => [r.key, r.emphasis])).toEqual([
      ["a", "LARGE"],
      ["b", "MEDIUM"],
      ["c", "MEDIUM"],
    ])
  })

  it("treats an empty entry list the same as none at all", () => {
    expect(resolveBentoLayout(items("a", "b"), key, [])).toEqual(
      resolveBentoLayout(items("a", "b"), key, undefined),
    )
  })

  it("orders by displayOrder and sizes by the persisted emphasis", () => {
    const resolved = resolveBentoLayout(items("a", "b", "c"), key, [
      entry("c", 0, "LARGE"),
      entry("a", 1, "SMALL"),
      entry("b", 2, "MEDIUM"),
    ])

    expect(resolved.map((r) => [r.key, r.emphasis])).toEqual([
      ["c", "LARGE"],
      ["a", "SMALL"],
      ["b", "MEDIUM"],
    ])
  })

  it("keeps an item created since the layout was saved, at the end, in natural order", () => {
    const resolved = resolveBentoLayout(items("a", "new-1", "b", "new-2"), key, [
      entry("b", 0),
      entry("a", 1),
    ])

    expect(resolved.map((r) => r.key)).toEqual(["b", "a", "new-1", "new-2"])
  })

  it("sizes an unlisted item MEDIUM rather than dropping or featuring it", () => {
    const resolved = resolveBentoLayout(items("a", "fresh"), key, [entry("a", 0, "LARGE")])

    expect(resolved.find((r) => r.key === "fresh")?.emphasis).toBe("MEDIUM")
  })

  it("ignores an entry whose item is gone rather than rendering a hole", () => {
    const resolved = resolveBentoLayout(items("a"), key, [entry("deleted", 0), entry("a", 1)])

    expect(resolved.map((r) => r.key)).toEqual(["a"])
  })

  it("breaks a displayOrder tie by the item's natural position", () => {
    const resolved = resolveBentoLayout(items("a", "b"), key, [entry("b", 5), entry("a", 5)])

    expect(resolved.map((r) => r.key)).toEqual(["a", "b"])
  })

  it("returns nothing for no items, with or without entries", () => {
    expect(resolveBentoLayout([], key, undefined)).toEqual([])
    expect(resolveBentoLayout([], key, [entry("a", 0)])).toEqual([])
  })

  it("carries the original item through, not a copy of its key", () => {
    const source = items("a")
    expect(resolveBentoLayout(source, key, undefined)[0].item).toBe(source[0])
  })
})

describe("toBentoLayoutEntries", () => {
  it("numbers displayOrder by array position, which is what a drag produces", () => {
    const resolved = resolveBentoLayout(items("a", "b", "c"), key, [
      entry("c", 0, "LARGE"),
      entry("b", 1, "SMALL"),
      entry("a", 2, "MEDIUM"),
    ])

    expect(toBentoLayoutEntries(resolved)).toEqual([
      { itemId: "c", emphasis: "LARGE", displayOrder: 0 },
      { itemId: "b", emphasis: "SMALL", displayOrder: 1 },
      { itemId: "a", emphasis: "MEDIUM", displayOrder: 2 },
    ])
  })

  it("round-trips a resolved layout unchanged", () => {
    const first = resolveBentoLayout(items("a", "b", "c"), key, undefined)
    const second = resolveBentoLayout(items("a", "b", "c"), key, toBentoLayoutEntries(first))

    expect(second.map((r) => [r.key, r.emphasis])).toEqual(
      first.map((r) => [r.key, r.emphasis]),
    )
  })
})

describe("the emphasis maps", () => {
  it("cycles SMALL to MEDIUM to LARGE and back", () => {
    expect(BENTO_EMPHASIS_NEXT.SMALL).toBe("MEDIUM")
    expect(BENTO_EMPHASIS_NEXT.MEDIUM).toBe("LARGE")
    expect(BENTO_EMPHASIS_NEXT.LARGE).toBe("SMALL")
  })

  it("gives every emphasis a span, so no tile can render unsized", () => {
    for (const emphasis of ["SMALL", "MEDIUM", "LARGE"] as const) {
      expect(BENTO_EMPHASIS_SPAN[emphasis]).toMatch(/col-span-\d/)
    }
  })
})
