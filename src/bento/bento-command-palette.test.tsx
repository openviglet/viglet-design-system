import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2, IconSearch } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  BentoCommandPalette,
  BentoShortcutsDialog,
  bentoNavTarget,
  type BentoNavItem,
} from "./index"

// The palette is generic and its data is not. Moving both together would have
// put one console's routes inside another's, so what is asserted here is mostly
// the seam: the array comes in, and nothing about either product stays behind.

const items: BentoNavItem[] = [
  {
    id: "models",
    titleKey: "Language models",
    descriptionKey: "Every model this install can reach",
    icon: IconCpu2,
    section: "generativeAi",
    tone: "blue",
    bentoRoute: "/ai/models",
    fallbackRoute: "/admin/llm",
  },
  {
    id: "indexing",
    titleKey: "Indexing",
    descriptionKey: "Crawlers and schedules",
    icon: IconSearch,
    section: "search",
    tone: "emerald",
    // Not migrated yet: the palette should still reach it, through the fallback.
    fallbackRoute: "/admin/indexing",
  },
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

describe("bentoNavTarget", () => {
  it("prefers a surface's own route", () => {
    expect(bentoNavTarget(items[0])).toBe("/ai/models")
  })

  it("falls back while a surface has not moved yet", () => {
    expect(bentoNavTarget(items[1])).toBe("/admin/indexing")
  })
})

describe("BentoCommandPalette", () => {
  it("lists the items it was given, and nothing else", () => {
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    expect(screen.getByText("Language models")).toBeInTheDocument()
    expect(screen.getByText("Indexing")).toBeInTheDocument()
  })

  it("renders an empty palette rather than failing with no items", () => {
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={[]} />)

    expect(screen.queryByText("Language models")).not.toBeInTheDocument()
  })

  it("filters as the reader types", async () => {
    const user = userEvent.setup()
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    await user.type(screen.getByRole("combobox"), "index")

    expect(screen.getByText("Indexing")).toBeInTheDocument()
    expect(screen.queryByText("Language models")).not.toBeInTheDocument()
  })

  it("matches on the description too, not just the title", async () => {
    const user = userEvent.setup()
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    // "Crawlers and schedules" is Indexing's description. It used to find
    // nothing, which sent a reader who remembered what a surface does — rather
    // than what it is called — back to the nav they opened this to avoid.
    await user.type(screen.getByRole("combobox"), "crawler")

    expect(screen.getByText("Indexing")).toBeInTheDocument()
    expect(screen.queryByText("Language models")).not.toBeInTheDocument()
  })

  it("ranks a title match above a description match", async () => {
    const user = userEvent.setup()
    draw(
      <BentoCommandPalette
        open
        onOpenChange={vi.fn()}
        items={[
          { ...items[0], titleKey: "Storage", descriptionKey: "Where files live" },
          { ...items[1], titleKey: "Indexing", descriptionKey: "Storage and schedules" },
        ]}
      />,
    )

    // Both match; the one that is *called* Storage comes first, so a reader
    // half-remembering a name does not scroll past entries that mention it.
    await user.type(screen.getByRole("combobox"), "storage")

    const options = screen.getAllByRole("option")
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent("Storage")
    expect(options[1]).toHaveTextContent("Indexing")
  })

  it("marks a surface that has not moved yet, so a jump out is not a surprise", () => {
    const notMigrated = draw(
      <BentoCommandPalette open onOpenChange={vi.fn()} items={[items[1]]} />,
    )
    expect(
      notMigrated.baseElement.querySelector(".tabler-icon-external-link"),
    ).toBeInTheDocument()
    notMigrated.unmount()

    const migrated = draw(
      <BentoCommandPalette open onOpenChange={vi.fn()} items={[items[0]]} />,
    )
    expect(
      migrated.baseElement.querySelector(".tabler-icon-external-link"),
    ).not.toBeInTheDocument()
  })

  it("closes when an entry is chosen", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    draw(<BentoCommandPalette open onOpenChange={onOpenChange} items={items} />)

    await user.click(screen.getByText("Language models"))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("BentoShortcutsDialog", () => {
  it("renders when open", () => {
    draw(<BentoShortcutsDialog open onOpenChange={vi.fn()} isMac={false} />)

    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("stays shut when closed", () => {
    draw(<BentoShortcutsDialog open={false} onOpenChange={vi.fn()} isMac={false} />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})

// The criterion's own words: no route or surface of either product is in it.
// Asserted over the sources rather than trusted, because a route pasted into a
// default value is exactly the kind of thing that survives review.
describe("no product's routes live in the bento layer", () => {
  const bentoDir = resolve(import.meta.dirname)
  const PRODUCT_PATHS =
    /["'`]\/(admin|console|bento|llm|ai-agent|aiAgent|se|store|otca|sn)(\/[\w-]*)*["'`]/

  function sources(dir: string, found: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) sources(full, found)
      // Stories are excluded deliberately: a story supplies routes as example
      // data, which is what a consumer does. The rule is about what the
      // components themselves carry.
      else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\./.test(entry.name)) {
        found.push(full)
      }
    }
    return found
  }

  it.each(sources(bentoDir).map((f) => f.replace(bentoDir, "").replace(/\\/g, "/")))(
    "%s",
    (name) => {
      const source = readFileSync(join(bentoDir, name), "utf8")
      const match = PRODUCT_PATHS.exec(source)
      expect(
        match?.[0],
        `${name} contains ${match?.[0]}, which is a product's route. ` +
          "Routes arrive as props — the package holds the schema, never the array.",
      ).toBeUndefined()
    },
  )
})

// Ported from the product's suite: the paths a keyboard-first launcher is
// actually driven through.
describe("BentoCommandPalette, ported cases", () => {
  it("says so when nothing matches, rather than showing an empty box", async () => {
    const user = userEvent.setup()
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    await user.type(screen.getByRole("combobox"), "zzzzz")

    expect(screen.getByRole("listbox")).toHaveTextContent(/./)
    expect(screen.queryByText("Language models")).not.toBeInTheDocument()
  })

  it("takes the first result on Enter and closes", async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    draw(<BentoCommandPalette open onOpenChange={onOpenChange} items={items} />)

    await user.type(screen.getByRole("combobox"), "index")
    await user.keyboard("{Enter}")

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("moves the selected row with the arrow keys", async () => {
    const user = userEvent.setup()
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true")

    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowDown}")

    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true")
  })
})

// VDS123 — the group a product fills. The palette used to take nav items and
// nothing else, so a consumer searching its own records either rebuilt the
// dialog or handed over a pre-built list for the client matcher to reorder. The
// assertions below are about the two halves of that: the product's order is the
// answer, and a query that has not come back yet is not an empty one.

const records = [
  { id: "r1", label: "Quarterly report", description: "2026 Q1" },
  { id: "r2", label: "Annual report", description: "2025" },
]

describe("BentoCommandPalette — the group a product fills", () => {
  it("renders the supplied items under their own heading", () => {
    draw(
      <BentoCommandPalette
        open
        onOpenChange={vi.fn()}
        items={items}
        group={{ label: "Documents", items: records, onSelect: vi.fn() }}
      />,
    )

    const documents = screen.getByRole("group", { name: "Documents" })

    expect(within(documents).getByText("Quarterly report")).toBeInTheDocument()
    expect(within(documents).getByText("Annual report")).toBeInTheDocument()
  })

  it("keeps the product's order, whatever the query says", async () => {
    const user = userEvent.setup()
    draw(
      <BentoCommandPalette
        open
        onOpenChange={vi.fn()}
        items={[]}
        group={{ label: "Documents", items: records, onSelect: vi.fn() }}
      />,
    )

    // "Annual" is the closer substring match; the product ranked it second and
    // that is the answer, so nothing here reorders it.
    await user.type(screen.getByRole("combobox"), "annual")

    const labels = screen.getAllByRole("option").map((o) => o.textContent)
    expect(labels[0]).toContain("Quarterly report")
    expect(labels[1]).toContain("Annual report")
  })

  it("reports the query as typed, and again when it reopens", async () => {
    const user = userEvent.setup()
    const onQueryChange = vi.fn()
    const { rerender } = draw(
      <BentoCommandPalette open onOpenChange={vi.fn()} items={items} onQueryChange={onQueryChange} />,
    )

    await user.type(screen.getByRole("combobox"), "re")
    expect(onQueryChange).toHaveBeenLastCalledWith("re")

    rerender(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoCommandPalette open={false} onOpenChange={vi.fn()} items={items} onQueryChange={onQueryChange} />
        </MemoryRouter>
      </I18nextProvider>,
    )
    rerender(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoCommandPalette open onOpenChange={vi.fn()} items={items} onQueryChange={onQueryChange} />
        </MemoryRouter>
      </I18nextProvider>,
    )

    expect(onQueryChange).toHaveBeenLastCalledWith("")
  })

  it("calls back with the chosen item and closes", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    const onOpenChange = vi.fn()
    draw(
      <BentoCommandPalette
        open
        onOpenChange={onOpenChange}
        items={[]}
        group={{ label: "Documents", items: records, onSelect }}
      />,
    )

    await user.click(screen.getByText("Quarterly report"))

    expect(onSelect).toHaveBeenCalledWith(records[0])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("says it is still resolving rather than showing no matches", () => {
    draw(
      <BentoCommandPalette
        open
        onOpenChange={vi.fn()}
        items={[]}
        group={{ label: "Documents", items: [], pending: true, onSelect: vi.fn() }}
      />,
    )

    // This suite runs i18next with empty resources and a handler that returns
    // the key, so a package string renders as its key rather than its bundle
    // text. The product's own words above are literals and read as themselves.
    expect(screen.getByText("bento.palette.searching")).toBeInTheDocument()
    expect(screen.queryByText("bento.palette.noResults")).not.toBeInTheDocument()
  })

  it("runs one arrow-key cursor across both groups", async () => {
    const user = userEvent.setup()
    draw(
      <BentoCommandPalette
        open
        onOpenChange={vi.fn()}
        items={items}
        group={{ label: "Documents", items: records, onSelect: vi.fn() }}
      />,
    )

    const options = () => screen.getAllByRole("option")
    expect(options()).toHaveLength(4)

    await user.click(screen.getByRole("combobox"))
    await user.keyboard("{ArrowDown}{ArrowDown}")

    // Off the end of the nav group and into the product's, with no second cursor.
    expect(options()[2]).toHaveAttribute("aria-selected", "true")
    expect(options()[2].textContent).toContain("Quarterly report")
  })

  it("heads no group when the product supplies none", () => {
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    expect(screen.queryByRole("group")).not.toBeInTheDocument()
  })
})
