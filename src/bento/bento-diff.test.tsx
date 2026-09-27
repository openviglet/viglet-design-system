import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import { type ReactElement, useState } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoDiff, BentoVersionRail, type BentoDiffField, type BentoVersion } from "./index"

// VDS140 — one comparison for revision history, review and translation, and the
// rail two versions are picked from. Asserted on what a reader gets, including one
// who cannot see the colours.

const FIELDS: BentoDiffField[] = [
  { id: "title", label: "Title" },
  { id: "body", label: "Body", kind: "rich" },
  { id: "order", label: "Order", kind: "value" },
  { id: "slug", label: "Slug" },
]

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

/** A field's row, found by its label. */
const field = (label: string) => screen.getByText(label, { selector: "dt > span:first-child" }).closest("div")!

describe("BentoDiff", () => {
  it("renders a created page's content as additions, not an empty panel", () => {
    draw(
      <BentoDiff
        before={null}
        after={{ title: "Quarterly results", body: "<h2>Summary</h2><p>Margin rose.</p>", order: 3, slug: "q3" }}
        fields={FIELDS}
      />,
    )

    expect(screen.getByText("Created in this version")).toBeInTheDocument()
    const body = field("Body")
    expect(within(body).getByText("Added")).toBeInTheDocument()
    expect(body.querySelectorAll("ins")).toHaveLength(2)
    expect(body).toHaveTextContent("Summary")
    expect(body).toHaveTextContent("Margin rose.")
    expect(screen.queryByText("No field changed")).not.toBeInTheDocument()
  })

  it("names a change in words as well as colour", () => {
    draw(
      <BentoDiff
        before={{ title: "Quarterly results", slug: "q3" }}
        after={{ title: "Third quarter results", slug: "q3" }}
        fields={FIELDS}
      />,
    )

    const title = field("Title")
    expect(within(title).getByText("Changed")).toBeInTheDocument()
    // The words that moved, each carrying what happened to it as text.
    const removed = [...title.querySelectorAll("del")]
    const added = [...title.querySelectorAll("ins")]
    expect(removed.map((el) => el.textContent)).toEqual(["removed: Quarterly"])
    expect(added.length).toBeGreaterThan(0)
    for (const el of added) expect(el.textContent).toMatch(/^added: /)
    expect(added.map((el) => el.textContent!.replace("added: ", "")).join("")).toMatch(/Third\s*quarter/)
    // What stayed is not marked.
    expect([...removed, ...added].some((el) => el.textContent!.includes("results"))).toBe(false)
  })

  it("treats a change of markup alone as no change, and diffs rich text by block", () => {
    const { unmount } = draw(
      <BentoDiff before={{ body: "<p>Hello <b>world</b></p>" }} after={{ body: "<p>Hello world</p>" }} fields={FIELDS} />,
    )
    expect(screen.getByText("No field changed")).toBeInTheDocument()
    unmount()

    draw(
      <BentoDiff
        before={{ body: "<p>One.</p><p>Two.</p>" }}
        after={{ body: "<p>One.</p><p>Inserted.</p><p>Two.</p>" }}
        fields={FIELDS}
      />,
    )
    const body = field("Body")
    // The paragraph added between two others is one added block; the others stand.
    expect(body.querySelectorAll("ins")).toHaveLength(1)
    expect(body.querySelector("ins")).toHaveTextContent("Inserted.")
    expect(body.querySelectorAll("del")).toHaveLength(0)
  })

  it("collapses unchanged fields behind a count a reader can open", async () => {
    const user = userEvent.setup()
    draw(<BentoDiff before={{ title: "A", slug: "a", order: 1 }} after={{ title: "B", slug: "a", order: 1 }} fields={FIELDS} />)

    const toggle = screen.getByRole("button", { name: "3 unchanged" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Slug", { selector: "dt > span:first-child" })).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(field("Slug")).toHaveTextContent("Unchanged")
  })

  it("shows a value field's two sides, and a deleted item as removals", () => {
    const { unmount } = draw(<BentoDiff before={{ order: 1 }} after={{ order: 2 }} fields={FIELDS} />)
    const order = field("Order")
    expect(order.querySelector("del")).toHaveTextContent("1")
    expect(order.querySelector("ins")).toHaveTextContent("2")
    unmount()

    draw(<BentoDiff before={{ title: "Gone" }} after={null} fields={FIELDS} />)
    expect(screen.getByText("Deleted in this version")).toBeInTheDocument()
    expect(field("Title").querySelector("del")).toHaveTextContent("Gone")
  })
})

describe("BentoDiff lines", () => {
  // VDS168 — a source file compared by line, as a review tool reads one.
  const SOURCE: BentoDiffField[] = [{ id: "file", label: "src/app.ts", kind: "lines" }]
  const file = (count: number, edit?: [number, string]) =>
    Array.from({ length: count }, (_, i) => (edit && edit[0] === i ? edit[1] : `const line${i + 1} = ${i + 1}`)).join("\n") + "\n"
  const rows = (op: string) => [...document.querySelectorAll(`tr[data-op="${op}"]`)] as HTMLTableRowElement[]
  const numbers = (row: HTMLTableRowElement) => [...row.cells].slice(0, 2).map((cell) => cell.textContent)

  it("draws one edit in a long file as one numbered hunk, not a rewrite", async () => {
    const user = userEvent.setup()
    draw(<BentoDiff before={{ file: file(5000) }} after={{ file: file(5000, [2499, "const line2500 = 0"]) }} fields={SOURCE} />)

    const [removed] = rows("remove")
    const [added] = rows("add")
    expect(rows("remove")).toHaveLength(1)
    expect(rows("add")).toHaveLength(1)
    expect(numbers(removed)).toEqual(["2500", ""])
    expect(numbers(added)).toEqual(["", "2500"])
    // The sign is in text beside the tint, and the edit inside the line is a word diff.
    expect(removed.cells[2]).toHaveTextContent("−")
    expect(removed.querySelector("del")).toHaveTextContent("2500")
    expect(added.querySelector("ins")).toHaveTextContent("0")
    // Three unchanged lines on either side, the rest folded behind a count.
    expect(rows("same")).toHaveLength(6)
    expect(numbers(rows("same")[0])).toEqual(["2497", "2497"])
    const before = screen.getByRole("button", { name: "2496 unchanged lines" })
    expect(screen.getByRole("button", { name: "2497 unchanged lines" })).toHaveAttribute("aria-expanded", "false")

    await user.click(before)
    expect(before).toHaveAttribute("aria-expanded", "true")
    expect(rows("same")).toHaveLength(6 + 2496)
    expect(numbers(rows("same")[0])).toEqual(["1", "1"])
  })

  it("keeps the field scrolling sideways and reachable by Tab", () => {
    draw(<BentoDiff before={{ file: "a\n" }} after={{ file: "b\n" }} fields={SOURCE} />)
    const region = screen.getByRole("region", { name: "src/app.ts" })
    expect(region).toHaveAttribute("tabindex", "0")
    expect(region.className).toContain("overflow-x-auto")
  })

  it("draws a created or a deleted file whole, numbered on its one side", () => {
    const { unmount } = draw(<BentoDiff before={null} after={{ file: file(40) }} fields={SOURCE} />)
    expect(screen.getByText("Created in this version")).toBeInTheDocument()
    expect(rows("add")).toHaveLength(40)
    expect(rows("add").map(numbers).at(-1)).toEqual(["", "40"])
    expect(screen.queryByRole("button", { name: /unchanged lines/ })).not.toBeInTheDocument()
    unmount()

    draw(<BentoDiff before={{ file: file(40) }} after={null} fields={SOURCE} />)
    expect(screen.getByText("Deleted in this version")).toBeInTheDocument()
    expect(rows("remove")).toHaveLength(40)
    expect(rows("remove").map(numbers)[0]).toEqual(["1", ""])
  })

  describe("split", () => {
    // VDS169 — the original beside the change, as VS Code opens a changed file.
    const split = () => document.querySelector<HTMLTableElement>('table[data-layout="split"]')!
    const cells = (row: HTMLTableRowElement) => [...row.cells].map((cell) => cell.textContent)

    it("keeps the unchanged lines level on both sides of a hunk that grew", () => {
      const before = "one\ntwo\nthree\nfour\n"
      const after = "one\nTWO\nextra a\nextra b\nthree\nfour\n"
      draw(<BentoDiff before={{ file: before }} after={{ file: after }} fields={SOURCE} layout="split" />)

      const trs = [...split().tBodies[0].rows]
      expect(trs.map(cells)).toEqual([
        ["1", " ", "one", "1", " ", "one"],
        // The pair is compared word by word on both sides...
        ["2", "−", "removed: two", "2", "+", "added: TWO"],
        // ...and where the right runs longer the left is a hatched cell.
        ["", "3", "+", "added: extra a"],
        ["", "4", "+", "added: extra b"],
        // So the line after the hunk is level, each column carrying its own number.
        ["3", " ", "three", "5", " ", "three"],
        ["4", " ", "four", "6", " ", "four"],
      ])
      expect(trs[2].cells[0]).toHaveAttribute("data-empty")
    })

    it("folds between hunks across both columns, sharing the inline layout's folds", async () => {
      const user = userEvent.setup()
      draw(<BentoDiff before={{ file: file(40) }} after={{ file: file(40, [0, "first"]) }} fields={SOURCE} layout="split" />)

      const toggles = screen.getAllByRole("button", { name: "36 unchanged lines" })
      // One fold in each layout, only one of which a container query shows.
      expect(toggles).toHaveLength(2)
      const splitFold = split().querySelector("button")!
      expect(splitFold.closest("td")).toHaveAttribute("colspan", "6")

      await user.click(splitFold)
      for (const toggle of toggles) expect(toggle).toHaveAttribute("aria-expanded", "true")
    })

    it("draws as inline under the container width, and a lines field alone takes the layout", () => {
      draw(
        <BentoDiff
          before={{ title: "Old", file: "a\n" }}
          after={{ title: "New", file: "b\n" }}
          fields={[{ id: "title", label: "Title" }, ...SOURCE]}
          layout="split"
        />,
      )
      const region = screen.getByRole("region", { name: "src/app.ts" })
      expect(region.className).toContain("@container/diff")
      const inline = region.querySelector('table[data-layout="inline"]')!
      expect(inline.className).toContain("@3xl/diff:hidden")
      expect(split().className).toMatch(/(^|\s)hidden(\s|$)/)
      expect(split().className).toContain("@3xl/diff:table")
      // A text field has no rows to align.
      expect(field("Title").querySelector("table")).toBeNull()
    })

    it("draws one table in the default layout", () => {
      draw(<BentoDiff before={{ file: "a\n" }} after={{ file: "b\n" }} fields={SOURCE} />)
      expect(document.querySelectorAll("table")).toHaveLength(1)
      expect(split()).toBeNull()
    })
  })

  it("says the comparison was not made past the ceiling on the changed middle", () => {
    draw(<BentoDiff before={{ file: file(1000) }} after={{ file: file(1000).replaceAll("const", "let") }} fields={SOURCE} />)
    expect(screen.getByText("Too many lines changed to compare them here")).toBeInTheDocument()
    expect(rows("add")).toHaveLength(0)
  })
})

describe("BentoVersionRail", () => {
  const VERSIONS: BentoVersion[] = [
    { id: "v3", author: "Drafting agent", actor: "agent", at: "2026-09-12T10:00:00Z", summary: "Rewrote the summary" },
    { id: "v2", author: "Ana Silva", actor: "human", at: "2026-09-11T10:00:00Z" },
    { id: "v1", author: "Ana Silva", actor: "human", at: "2026-09-10T10:00:00Z" },
  ]

  function Rail({ spy }: Readonly<{ spy: (ids: string[]) => void }>) {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <BentoVersionRail
        versions={VERSIONS}
        selected={selected}
        onSelect={(ids) => {
          spy(ids)
          setSelected(ids)
        }}
      />
    )
  }

  it("says who made each version and whether a person or an agent did", () => {
    draw(<Rail spy={() => {}} />)
    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveTextContent("Drafting agent")
    expect(options[0]).toHaveTextContent("Agent")
    expect(options[1]).toHaveTextContent("Person")
    expect(options[0].querySelector("time")).toHaveAttribute("dateTime", "2026-09-12T10:00:00.000Z")
  })

  it("picks two versions from the keyboard, older first, and lets go of the oldest pick on a third", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Rail spy={spy} />)

    const listbox = screen.getByRole("listbox", { name: "Versions" })
    expect(listbox).toHaveAttribute("aria-multiselectable", "true")

    screen.getAllByRole("option")[0].focus()
    await user.keyboard(" ")
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")
    expect(spy).toHaveBeenLastCalledWith(["v1", "v3"])
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual(["true", "false", "true"])

    await user.keyboard("{ArrowUp} ")
    // v3 was picked first, so it is the one let go.
    expect(spy).toHaveBeenLastCalledWith(["v1", "v2"])
    expect(screen.getAllByRole("option")[1]).toHaveFocus()
  })
})
