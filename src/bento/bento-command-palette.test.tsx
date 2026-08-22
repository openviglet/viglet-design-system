import { readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { render, screen } from "@testing-library/react"
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

  it("matches on the title only, which is narrower than it reads", async () => {
    const user = userEvent.setup()
    draw(<BentoCommandPalette open onOpenChange={vi.fn()} items={items} />)

    // "Crawlers and schedules" is Indexing's description, and it finds nothing.
    // Pinned as the behaviour it is rather than the behaviour it looks like;
    // widening it is VDS38, not a change to make while moving the file.
    await user.type(screen.getByRole("combobox"), "crawler")

    expect(screen.queryByText("Indexing")).not.toBeInTheDocument()
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
      else if (/\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)) found.push(full)
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
