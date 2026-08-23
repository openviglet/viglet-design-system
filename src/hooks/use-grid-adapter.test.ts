import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useGridAdapter } from "./use-grid-adapter"

// The memo used to depend on `data` alone while reading every extractor out of
// `config`. A product whose `url` builder closes over a route param, or whose
// `description` extractor closes over the locale, got the previous array back
// for as long as the rows themselves did not change — stale links and stale
// copy, with nothing logged. Both halves are pinned here: the recompute that
// was missing, and the memo that a naive `[data, config]` fix would have cost.

interface Doc {
  id: number
  title: string
  summary: string
  glyph: string
}

const docs: Doc[] = [
  { id: 7, title: "Getting started", summary: "The short way in", glyph: "book" },
  { id: 9, title: "Reference", summary: "Every option", glyph: "list" },
]

describe("useGridAdapter", () => {
  it("recomputes when an extractor changes and the rows do not", () => {
    const { result, rerender } = renderHook(
      ({ locale }: { locale: string }) =>
        useGridAdapter(docs, {
          name: "title",
          description: "summary",
          url: (doc: Doc) => `/${locale}/docs/${doc.id}`,
        }),
      { initialProps: { locale: "en" } },
    )

    expect(result.current.map((item) => item.url)).toEqual([
      "/en/docs/7",
      "/en/docs/9",
    ])

    rerender({ locale: "pt" })

    expect(result.current.map((item) => item.url)).toEqual([
      "/pt/docs/7",
      "/pt/docs/9",
    ])
  })

  it("does not defeat the memo when data and extractors are unchanged", () => {
    const url = (doc: Doc) => `/docs/${doc.id}`

    const { result, rerender } = renderHook(() =>
      // A fresh object literal every render, which is what every call site
      // writes: the memo holds because the extractors inside it are stable.
      useGridAdapter(docs, { name: "title", description: "summary", url }),
    )

    const first = result.current
    rerender()

    expect(result.current).toBe(first)
  })

  it("coerces a numeric primary key to the string VigGridItem declares", () => {
    const { result } = renderHook(() =>
      useGridAdapter(docs, {
        name: "title",
        description: "summary",
        url: (doc: Doc) => `/docs/${doc.id}`,
      }),
    )

    expect(result.current.map((item) => item.id)).toEqual(["7", "9"])
  })

  it("resolves an optional icon extractor, and reports null without one", () => {
    const { result, rerender } = renderHook(
      ({ withIcon }: { withIcon: boolean }) =>
        useGridAdapter(docs, {
          name: "title",
          description: "summary",
          url: (doc: Doc) => `/docs/${doc.id}`,
          icon: withIcon ? "glyph" : undefined,
        }),
      { initialProps: { withIcon: false } },
    )

    expect(result.current.map((item) => item.icon)).toEqual([null, null])

    rerender({ withIcon: true })

    expect(result.current.map((item) => item.icon)).toEqual(["book", "list"])
  })

  it("returns an empty array for absent or empty data", () => {
    const config = {
      name: "title" as const,
      description: "summary" as const,
      url: (doc: Doc) => `/docs/${doc.id}`,
    }

    const { result: absent } = renderHook(() => useGridAdapter(null, config))
    expect(absent.current).toEqual([])

    const { result: empty } = renderHook(() => useGridAdapter([], config))
    expect(empty.current).toEqual([])
  })
})
