import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconTrash } from "@tabler/icons-react"
import i18next from "i18next"
import { type ReactElement, useState } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  BentoDataTable,
  BentoFilterBar,
  EMPTY_FILTERS,
  type BentoFilterFacet,
  type BentoFilterValue,
} from "./index"

// VDS139 — the filter row, drawn once. Asserted the way a reader meets it: named
// chips and menus, driven from the keyboard, and one change per action.

const FACETS: BentoFilterFacet[] = [
  {
    id: "type",
    kind: "choice",
    label: "Type",
    options: [
      { value: "article", label: "Article" },
      { value: "page", label: "Page" },
    ],
  },
  {
    id: "state",
    kind: "choice",
    label: "State",
    multiple: true,
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  },
  { id: "updated", kind: "date", label: "Updated" },
]

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

/** The bar as a product mounts it: the value lives above, and every change is recorded. */
function Controlled({ initial = EMPTY_FILTERS, spy, delay = 40 }: Readonly<{ initial?: BentoFilterValue; spy: (v: BentoFilterValue) => void; delay?: number }>) {
  const [value, setValue] = useState(initial)
  return (
    <BentoFilterBar
      value={value}
      facets={FACETS}
      queryDelay={delay}
      onChange={(next) => {
        spy(next)
        setValue(next)
      }}
    />
  )
}

describe("BentoFilterBar", () => {
  it("renders every active filter as a named button that removes it, and nothing else", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(
      <Controlled
        spy={spy}
        initial={{ query: "", facets: { type: ["page"], state: ["draft", "published"], updated: { from: "2026-09-01" } } }}
      />,
    )

    const chips = within(screen.getByRole("list", { name: "Active filters" }))
    expect(chips.getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Remove filter Type: Page",
      "Remove filter State: Draft",
      "Remove filter State: Published",
      "Remove filter Updated: 2026-09-01 – …",
      null,
    ])

    await user.click(chips.getByRole("button", { name: "Remove filter State: Draft" }))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].facets).toEqual({ type: ["page"], state: ["published"], updated: { from: "2026-09-01" } })

    await user.click(chips.getByRole("button", { name: "Clear all" }))
    expect(spy).toHaveBeenLastCalledWith(EMPTY_FILTERS)
    expect(screen.queryByRole("list", { name: "Active filters" })).not.toBeInTheDocument()
  })

  it("chooses from a facet with the keyboard alone, one change per choice", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Controlled spy={spy} />)

    screen.getByRole("button", { name: "Type" }).focus()
    await user.keyboard("{Enter}")
    const menu = await screen.findByRole("menu")
    expect(within(menu).getAllByRole("menuitemradio").map((i) => i.textContent)).toEqual(["Article", "Page"])

    await user.keyboard("{ArrowDown}{Enter}")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].facets.type).toHaveLength(1)
    expect(await screen.findByRole("button", { name: /^Remove filter Type: / })).toBeInTheDocument()
  })

  it("toggles several choices in a multiple facet without closing it", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Controlled spy={spy} />)

    await user.click(screen.getByRole("button", { name: "State" }))
    const menu = await screen.findByRole("menu")
    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "Draft" }))
    await user.click(within(menu).getByRole("menuitemcheckbox", { name: "Published" }))

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[1][0].facets.state).toEqual(["draft", "published"])
  })

  it("sends a typed query once the typing pauses, not once a keystroke", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Controlled spy={spy} />)

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "annual report")
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    expect(spy.mock.calls[0][0].query).toBe("annual report")

    // And a query cleared from outside empties the field.
    await user.click(screen.getByRole("button", { name: "Clear all" }))
    expect(screen.getByRole("searchbox", { name: "Search" })).toHaveValue("")
  })

  it("applies a date range as one change, from labelled fields", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Controlled spy={spy} />)

    await user.click(screen.getByRole("button", { name: "Updated" }))
    await user.type(await screen.findByLabelText("From"), "2026-09-01")
    await user.type(screen.getByLabelText("To"), "2026-09-12")
    expect(spy).not.toHaveBeenCalled()

    await user.click(screen.getByRole("button", { name: "Apply" }))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0].facets.updated).toEqual({ from: "2026-09-01", to: "2026-09-12" })
  })
})

describe("BentoDataTable with a filter", () => {
  it("clears a selection when the scope the rows were chosen by changes", async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    const rows = Array.from({ length: 5 }, (_, i) => ({ id: `r${i}`, title: `Row ${i}` }))
    const tableWith = (scope: string) => (
      <I18nextProvider i18n={i18next}>
        <BentoDataTable
          rows={rows}
          getRowId={(r) => r.id}
          getRowLabel={(r) => r.title}
          columns={[{ id: "title", header: "Title", cell: (r) => r.title }]}
          label="Rows"
          selectionScope={scope}
          onSelectionChange={onSelectionChange}
          selectionActions={[{ id: "trash", label: "Trash", icon: IconTrash, onSelect: () => {} }]}
        />
      </I18nextProvider>
    )
    const { rerender } = render(tableWith('{"state":["draft"]}'))

    await user.click(screen.getByRole("checkbox", { name: "Select Row 1" }))
    expect(screen.getByText("1 selected")).toBeInTheDocument()

    rerender(tableWith('{"state":["published"]}'))
    expect(screen.queryByText("1 selected")).not.toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Select Row 1" })).not.toBeChecked()
    await waitFor(() => expect(onSelectionChange).toHaveBeenLastCalledWith([]))
  })
})
