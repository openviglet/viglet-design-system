import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoEntityTile, BentoListPage, type BentoListLayout } from "./index"

// Every product has list screens, and a hand-rolled grid is the fastest way for
// two consoles to stop matching. So the assertions cover the whole surface a
// page would otherwise rebuild: the mosaic, the New tile, the empty state, the
// error path, and the customise mode — including the seam where the product,
// not the package, owns where a layout is stored.

interface Item {
  id: string
  name: string
}

const items: Item[] = [
  { id: "a", name: "Alpha" },
  { id: "b", name: "Beta" },
  { id: "c", name: "Gamma" },
]

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

const draw = (ui: ReactElement) =>
  render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )

function list(overrides: Partial<React.ComponentProps<typeof BentoListPage<Item>>> = {}) {
  return draw(
    <BentoListPage<Item>
      items={items}
      tryAgainUrl="/llm"
      heroIcon={IconCpu2}
      title="Models"
      subtitle="Every model this install can reach"
      newRoute="/llm/new"
      newLabel="New model"
      itemKey={(i) => i.id}
      renderTile={(item, emphasis) => (
        <BentoEntityTile
          to={`/llm/${item.id}`}
          emphasis={emphasis}
          defaultIcon={IconCpu2}
          title={item.name}
        />
      )}
      emptyTitle="No models yet"
      emptyDescription="Add one to get started"
      {...overrides}
    />,
  )
}

describe("BentoListPage", () => {
  it("renders the hero and a tile per item", () => {
    list()

    expect(screen.getByText("Models")).toBeInTheDocument()
    for (const item of items) expect(screen.getByText(item.name)).toBeInTheDocument()
  })

  it("features the first tile and widens the rest, with spans in multiples of two", () => {
    const { container } = list()

    // LARGE is 2x2, MEDIUM 2x1 — the mosaic never produces a one-column tile
    // by default, which is what keeps two consoles' grids aligned.
    expect(container.querySelector(".row-span-2")).toBeInTheDocument()
    expect(container.querySelectorAll(".col-span-2").length).toBeGreaterThanOrEqual(3)
  })

  it("offers the New tile, linking where it was told", () => {
    list()

    expect(screen.getByRole("link", { name: /New model/ })).toHaveAttribute("href", "/llm/new")
  })

  it("hides the New tile for a read-only list", () => {
    list({ hideNew: true })

    expect(screen.queryByRole("link", { name: /New model/ })).not.toBeInTheDocument()
  })

  it("shows the empty state instead of a bare grid", () => {
    list({ items: [] })

    expect(screen.getByText("No models yet")).toBeInTheDocument()
    expect(screen.getByText("Add one to get started")).toBeInTheDocument()
  })

  it("shows the error path rather than an empty list", () => {
    list({ items: undefined, error: "Backend unreachable" })

    expect(screen.queryByText("Alpha")).not.toBeInTheDocument()
  })

  it("orders and sizes from a layout the product supplies", () => {
    const layout: BentoListLayout = {
      data: {
        listId: "llm",
        source: "USER",
        canEditGlobal: false,
        entries: [
          { itemId: "c", emphasis: "LARGE", displayOrder: 0 },
          { itemId: "a", emphasis: "SMALL", displayOrder: 1 },
          { itemId: "b", emphasis: "MEDIUM", displayOrder: 2 },
        ],
      },
      onSave: vi.fn(),
    }
    list({ listId: "llm", layout })

    const titles = screen.getAllByRole("link").map((l) => l.textContent)
    expect(titles.filter((t) => t && /Alpha|Beta|Gamma/.test(t))[0]).toContain("Gamma")
  })
})

describe("the customise affordance", () => {
  const layout = (over: Partial<BentoListLayout> = {}): BentoListLayout => ({
    data: { listId: "llm", source: "DEFAULT", canEditGlobal: false, entries: [] },
    onSave: vi.fn(),
    ...over,
  })

  it("is absent without a listId", () => {
    list({ layout: layout() })

    expect(screen.queryByRole("button", { name: /customize/i })).not.toBeInTheDocument()
  })

  it("is absent without somewhere to save to, even with a listId", () => {
    // A surface with an id but no persistence has nothing to remember with.
    list({ listId: "llm" })

    expect(screen.queryByRole("button", { name: /customize/i })).not.toBeInTheDocument()
  })

  it("appears when both an id and a layout are given", () => {
    list({ listId: "llm", layout: layout() })

    expect(screen.getByRole("button", { name: /customize/i })).toBeInTheDocument()
  })

  it("is absent for an empty list, which has nothing to arrange", () => {
    list({ items: [], listId: "llm", layout: layout() })

    expect(screen.queryByRole("button", { name: /customize/i })).not.toBeInTheDocument()
  })

  it("saves through the product's callback, with entries the resolver produced", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    list({ listId: "llm", layout: layout({ onSave }) })

    await user.click(screen.getByRole("button", { name: /customize/i }))
    await user.click(screen.getByRole("button", { name: /save/i }))

    expect(onSave).toHaveBeenCalledTimes(1)
    const entries = onSave.mock.calls[0][0]
    expect(entries).toHaveLength(items.length)
    expect(entries[0]).toMatchObject({ displayOrder: 0 })
  })

  it("hides the global and reset controls a product did not supply", async () => {
    const user = userEvent.setup()
    list({ listId: "llm", layout: layout() })

    await user.click(screen.getByRole("button", { name: /customize/i }))

    expect(screen.queryByRole("button", { name: /everyone/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument()
  })

  it("offers reset only once a layout has actually been customised", async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    list({
      listId: "llm",
      layout: layout({
        onReset,
        data: { listId: "llm", source: "USER", canEditGlobal: true, entries: [] },
      }),
    })

    await user.click(screen.getByRole("button", { name: /customize/i }))
    await user.click(screen.getByRole("button", { name: /reset/i }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it("disables the controls while a write is in flight", async () => {
    const user = userEvent.setup()
    list({ listId: "llm", layout: layout({ saving: true }) })

    await user.click(screen.getByRole("button", { name: /customize/i }))

    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled()
  })
})
