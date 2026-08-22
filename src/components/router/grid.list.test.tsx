import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import type { VigGridItem } from "@/models/grid-item"
import { GridList } from "./grid.list"

// GridList is the one exported component built on @tanstack/react-table, and a
// grouped Dependabot pull request took that dependency across a major without
// anything noticing for two weeks. A type-check would have caught that one; it
// would not catch a row model wired to the wrong slot, which renders an empty
// grid or an unfiltered one. So what is asserted here is behaviour: the search,
// the sort order, the page size and the actions.

const items: VigGridItem[] = [
  { id: "1", name: "Alpha site", description: "The first one", url: "/alpha" },
  { id: "2", name: "Beta site", description: "The second one", url: "/beta" },
  { id: "3", name: "Gamma", description: "Searchable by description", url: "/gamma" },
]

// Enough rows to force a second page: the default page size is 12.
const many: VigGridItem[] = Array.from({ length: 14 }, (_, i) => ({
  id: String(i),
  name: `Item ${String(i).padStart(2, "0")}`,
  description: `Row ${i}`,
  url: `/item-${i}`,
}))

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      // Render the key rather than an empty string, so a missing string is
      // visible in a failure message instead of silently matching "".
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function renderGrid(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

describe("GridList", () => {
  it("renders a card per item, linking to its url", () => {
    renderGrid(<GridList gridItemList={items} />)

    expect(screen.getByText("Alpha site")).toBeInTheDocument()
    expect(screen.getByText("Beta site")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Alpha site/ })).toHaveAttribute("href", "/alpha")
  })

  it("renders an empty grid without crashing", () => {
    renderGrid(<GridList gridItemList={[]} />)

    expect(screen.queryByRole("link")).not.toBeInTheDocument()
  })

  it("filters by name as the search box is typed into", async () => {
    const user = userEvent.setup()
    renderGrid(<GridList gridItemList={items} />)

    await user.type(screen.getByRole("textbox"), "Beta")

    expect(screen.getByText("Beta site")).toBeInTheDocument()
    expect(screen.queryByText("Alpha site")).not.toBeInTheDocument()
  })

  it("filters by description too, since both columns are searchable", async () => {
    const user = userEvent.setup()
    renderGrid(<GridList gridItemList={items} />)

    await user.type(screen.getByRole("textbox"), "Searchable")

    expect(screen.getByText("Gamma")).toBeInTheDocument()
    expect(screen.queryByText("Alpha site")).not.toBeInTheDocument()
  })

  it("does not match on a column outside the two searchable ones", async () => {
    const user = userEvent.setup()
    renderGrid(<GridList gridItemList={items} />)

    // "/beta" is the url column, which getColumnCanGlobalFilter excludes.
    await user.type(screen.getByRole("textbox"), "/beta")

    expect(screen.queryByText("Beta site")).not.toBeInTheDocument()
  })

  it("paginates, showing the first page and reaching the second", async () => {
    const user = userEvent.setup()
    renderGrid(<GridList gridItemList={many} />)

    expect(screen.getByText("Item 00")).toBeInTheDocument()
    expect(screen.queryByText("Item 13")).not.toBeInTheDocument()

    const next = screen.getAllByRole("button").at(-1)!
    await user.click(next)

    expect(screen.getByText("Item 13")).toBeInTheDocument()
    expect(screen.queryByText("Item 00")).not.toBeInTheDocument()
  })

  it("hands the original item to an item action", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    renderGrid(
      <GridList gridItemList={items}>
        <GridList.ItemAction label="Remove" onClick={onClick} />
      </GridList>,
    )

    const card = screen.getByText("Alpha site").closest(".group") as HTMLElement
    await user.click(within(card).getByTitle("Remove"))

    expect(onClick).toHaveBeenCalledWith(items[0])
  })
})
