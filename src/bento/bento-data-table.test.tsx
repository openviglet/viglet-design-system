import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconFileText, IconTrash } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoDataTable, type BentoDataTableColumn, type BentoDataTableProps } from "./index"

// VDS138 — the table a console lists thousands of things in. Asserted as a
// keyboard user and a screen reader meet it: roles, names, aria-selected and
// aria-sort, not class names.

interface Post {
  id: string
  title: string
  words: number
}

const posts = (count: number): Post[] =>
  Array.from({ length: count }, (_, i) => ({ id: `p${i}`, title: `Post ${i}`, words: (i * 37) % 101 }))

const columns: BentoDataTableColumn<Post>[] = [
  { id: "title", header: "Title", cell: (p) => p.title, sortValue: (p) => p.title, hideable: false },
  { id: "words", header: "Words", cell: (p) => p.words, sortValue: (p) => p.words },
]

beforeAll(async () => {
  // No missing-key handler: `t` falls back to the object-form default, so names
  // read the way a product that never registered the bundle would render them.
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

function table(props: Partial<BentoDataTableProps<Post>> = {}) {
  return (
    <BentoDataTable<Post>
      rows={posts(20)}
      getRowId={(p) => p.id}
      getRowLabel={(p) => p.title}
      columns={columns}
      label="Posts"
      rowHeight={40}
      height={400}
      {...props}
    />
  )
}

const bodyRows = () => screen.getAllByRole("row").filter((row) => row.getAttribute("aria-rowindex") !== "1")
const selectedTitles = () =>
  bodyRows()
    .filter((row) => row.getAttribute("aria-selected") === "true")
    .map((row) => within(row).getAllByRole("gridcell")[1].textContent)

describe("BentoDataTable", () => {
  it("mounts only the visible window of ten thousand rows, and follows the scroll", () => {
    draw(table({ rows: posts(10_000) }))

    const grid = screen.getByRole("grid", { name: "Posts" })
    expect(grid).toHaveAttribute("aria-rowcount", "10001")
    // 400px at 40px a row is ten, plus the overscan on each side.
    expect(bodyRows().length).toBeLessThan(30)

    const body = grid.querySelector<HTMLElement>("[role='rowgroup'] + [role='rowgroup']")!
    body.scrollTop = 40 * 5000
    fireEvent.scroll(body)

    const indices = bodyRows().map((row) => Number(row.getAttribute("aria-rowindex")))
    expect(indices).toContain(5002)
    expect(Math.min(...indices)).toBeGreaterThan(4900)
    expect(bodyRows().length).toBeLessThan(30)
  })

  it("extends a selection with shift and the arrows, and clears it with Escape", async () => {
    const user = userEvent.setup()
    draw(table({ selectionActions: [{ id: "trash", label: "Move to trash", icon: IconTrash, onSelect: () => {} }] }))

    bodyRows()[0].focus()
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{/Shift}")
    expect(selectedTitles()).toEqual(["Post 0", "Post 1", "Post 2"])
    expect(bodyRows()[2]).toHaveFocus()

    await user.keyboard("{Shift>}{ArrowUp}{/Shift}")
    expect(selectedTitles()).toEqual(["Post 0", "Post 1"])

    await user.keyboard("{Escape}")
    expect(selectedTitles()).toEqual([])
  })

  it("scrolls a row the keyboard reaches into the window, and focuses it", async () => {
    const user = userEvent.setup()
    draw(table({ rows: posts(2_000) }))

    bodyRows()[0].focus()
    await user.keyboard("{End}")
    const last = bodyRows().find((row) => row.getAttribute("aria-rowindex") === "2001")
    expect(last).toBeDefined()
    expect(last).toHaveFocus()
  })

  it("acts on the selection from the bar, and says how many are selected", async () => {
    const user = userEvent.setup()
    const trash = vi.fn()
    draw(table({ selectionActions: [{ id: "trash", label: "Move to trash", icon: IconTrash, onSelect: trash }] }))

    await user.click(within(bodyRows()[1]).getByRole("checkbox", { name: "Select Post 1" }))
    await user.click(within(bodyRows()[3]).getByRole("checkbox", { name: "Select Post 3" }))
    expect(screen.getByText("2 selected")).toBeInTheDocument()

    await user.click(within(screen.getByRole("toolbar")).getByRole("button", { name: "Move to trash" }))
    expect(trash.mock.calls[0][0].map((p: Post) => p.id)).toEqual(["p1", "p3"])
  })

  it("selects a range with shift-click and adds a row with ctrl-click", async () => {
    const user = userEvent.setup()
    draw(table({ selectionActions: [{ id: "x", label: "X", icon: IconTrash, onSelect: () => {} }] }))

    await user.click(within(bodyRows()[1]).getAllByRole("gridcell")[1])
    await user.keyboard("{Shift>}")
    await user.click(within(bodyRows()[4]).getAllByRole("gridcell")[1])
    await user.keyboard("{/Shift}")
    expect(selectedTitles()).toEqual(["Post 1", "Post 2", "Post 3", "Post 4"])

    await user.keyboard("{Control>}")
    await user.click(within(bodyRows()[7]).getAllByRole("gridcell")[1])
    await user.keyboard("{/Control}")
    expect(selectedTitles()).toContain("Post 7")
  })

  it("reaches every row action by keyboard, each named for a screen reader", async () => {
    const user = userEvent.setup()
    const open = vi.fn()
    draw(
      table({
        rowActions: [
          { id: "open", label: "Open", icon: IconFileText, onSelect: open },
          { id: "trash", label: "Move to trash", icon: IconTrash, tone: "destructive", onSelect: () => {} },
        ],
      }),
    )

    bodyRows()[2].focus()
    await user.tab()
    const trigger = screen.getByRole("button", { name: "Actions for Post 2" })
    expect(trigger).toHaveFocus()

    await user.keyboard("{Enter}")
    const menu = await screen.findByRole("menu")
    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Open", "Move to trash"])

    await user.keyboard("{Enter}")
    expect(open.mock.calls[0][0].map((p: Post) => p.id)).toEqual(["p2"])
  })

  it("sorts from a header that says how it sorts", async () => {
    const user = userEvent.setup()
    draw(table({ rows: posts(5) }))

    const header = screen.getByRole("columnheader", { name: "Words" })
    expect(header).toHaveAttribute("aria-sort", "none")

    await user.click(within(header).getByRole("button"))
    expect(header).toHaveAttribute("aria-sort", "ascending")
    const ascending = bodyRows().map((row) => Number(within(row).getAllByRole("gridcell")[1].textContent))
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b))

    await user.click(within(header).getByRole("button"))
    expect(header).toHaveAttribute("aria-sort", "descending")
  })

  it("hides a column from the picker and reports the layout, keeping one that is not hideable", async () => {
    const user = userEvent.setup()
    const onLayoutChange = vi.fn()
    draw(table({ onLayoutChange }))

    await user.click(screen.getByRole("button", { name: "Columns" }))
    const menu = await screen.findByRole("menu")
    expect(within(menu).queryByText("Title")).not.toBeInTheDocument()

    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "Words" }))
    expect(onLayoutChange).toHaveBeenCalledWith({ hidden: ["words"] })
    expect(screen.queryByRole("columnheader", { name: "Words" })).not.toBeInTheDocument()
  })

  it("opens a row on Enter, and says so when there is nothing to list", async () => {
    const user = userEvent.setup()
    const onRowOpen = vi.fn()
    const { unmount } = draw(table({ onRowOpen }))

    bodyRows()[4].focus()
    await user.keyboard("{Enter}")
    expect(onRowOpen).toHaveBeenCalledWith(expect.objectContaining({ id: "p4" }))
    unmount()

    draw(table({ rows: [] }))
    expect(screen.getByText("Nothing to show")).toBeInTheDocument()
  })
})

describe("BentoDataTable with a controlled selection", () => {
  // VDS174 — selectedIds is controlled the way layout is, so a page can select
  // every row or invert the selection without remounting a virtualised table.
  const actions = [{ id: "trash", label: "Trash", icon: IconTrash, onSelect: () => {} }]

  it("ticks exactly the rows it is given, and follows a new set with no remount", () => {
    const { rerender } = draw(table({ selectionActions: actions, selectedIds: ["p1", "p3"] }))
    const grid = screen.getByRole("grid", { name: "Posts" })
    expect(selectedTitles()).toEqual(["Post 1", "Post 3"])
    expect(screen.getByText("2 selected")).toBeInTheDocument()

    // Invert, as a page's own control would.
    const all = posts(20).map((p) => p.id)
    rerender(<I18nextProvider i18n={i18next}>{table({ selectionActions: actions, selectedIds: all.filter((id) => id !== "p1" && id !== "p3") })}</I18nextProvider>)
    expect(screen.getByRole("grid", { name: "Posts" })).toBe(grid)
    expect(selectedTitles()).not.toContain("Post 1")
    expect(selectedTitles()).toContain("Post 0")
    expect(screen.getByText("18 selected")).toBeInTheDocument()
  })

  it("reports a change without keeping a copy of its own", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    draw(table({ selectionActions: actions, selectedIds: ["p1"], onSelectionChange }))

    await user.click(screen.getByRole("checkbox", { name: "Select Post 2" }))
    expect(onSelectionChange).toHaveBeenLastCalledWith(["p1", "p2"])
    // The product did not pass the new set back, so the table still draws its own.
    expect(selectedTitles()).toEqual(["Post 1"])
  })

  it("draws nothing selected once the scope changes, until the product answers the clear", async () => {
    const onSelectionChange = vi.fn()
    const withScope = (scope: string, selectedIds: string[]) => (
      <I18nextProvider i18n={i18next}>
        {table({ selectionActions: actions, selectionScope: scope, selectedIds, onSelectionChange })}
      </I18nextProvider>
    )
    const ids = ["p1"]
    const { rerender } = render(withScope("draft", ids))
    expect(selectedTitles()).toEqual(["Post 1"])

    rerender(withScope("published", ids))
    expect(selectedTitles()).toEqual([])
    expect(onSelectionChange).toHaveBeenLastCalledWith([])

    rerender(withScope("published", ["p4"]))
    expect(selectedTitles()).toEqual(["Post 4"])
  })
})