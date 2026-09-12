import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2, IconSearch } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { UserProvider } from "@/contexts/user.context"

import { BentoBackToTop, BentoNavRail, BentoUserMenu, type BentoNavGroup } from "./index"

// A page can look bento inside a console that does not, which the conventions
// call the first mistake. So the shell has to be installable — and installable
// means it asks the product for its routes rather than carrying them, which is
// what these assertions are mostly about.

const groups: BentoNavGroup[] = [
  {
    section: { id: "generativeAi", labelKey: "Generative AI", icon: IconCpu2, areaRoute: "/ai" },
    items: [
      {
        id: "models",
        titleKey: "Models",
        descriptionKey: "Language models",
        icon: IconCpu2,
        section: "generativeAi",
        tone: "blue",
        bentoRoute: "/ai/models",
        fallbackRoute: "/admin/llm",
      },
    ],
  },
  {
    // A section with no hub route is reached through its items, so the rail
    // does not show it.
    section: { id: "search", labelKey: "Search", icon: IconSearch },
    items: [],
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

function draw(ui: ReactElement, at = "/") {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter initialEntries={[at]}>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

describe("BentoNavRail", () => {
  it("renders Home plus one icon per section that has a hub", () => {
    draw(<BentoNavRail groups={groups} homeRoute="/bento" homeLabel="Home" />)

    expect(screen.getByRole("link", { name: /Home/ })).toHaveAttribute("href", "/bento")
    expect(screen.getByRole("link", { name: /Generative AI/ })).toHaveAttribute("href", "/ai")
    // The hubless section is not on the rail.
    expect(screen.queryByRole("link", { name: /Search/ })).not.toBeInTheDocument()
  })

  // VDS110 — `icon` and `labelKey` are optional on `BentoNavSection` and the
  // rail read both through a non-null assertion. Neither case is reachable from
  // a story, because the product supplies the array and both fixtures above set
  // every field; these two are what the assertions were standing in for.
  it("keeps a hub on the rail when its section has no icon", () => {
    const iconless: BentoNavGroup[] = [
      { section: { id: "search", labelKey: "Search", areaRoute: "/search" }, items: [] },
    ]

    draw(<BentoNavRail groups={iconless} homeRoute="/bento" homeLabel="Home" />)

    expect(screen.getByRole("link", { name: /Search/ })).toHaveAttribute("href", "/search")
  })

  it("names a hub by its id when its section has no label key", () => {
    const unlabelled: BentoNavGroup[] = [
      { section: { id: "generativeAi", icon: IconCpu2, areaRoute: "/ai" }, items: [] },
    ]

    draw(<BentoNavRail groups={unlabelled} homeRoute="/bento" homeLabel="Home" />)

    // A rail link is an icon and nothing else, so the accessible name is the
    // only thing that names it.
    expect(screen.getByRole("link", { name: "generativeAi" })).toHaveAttribute("href", "/ai")
  })

  it("marks Home active at the home route", () => {
    const { container } = draw(
      <BentoNavRail groups={groups} homeRoute="/bento" homeLabel="Home" />,
      "/bento",
    )

    expect(container.querySelector(".bento-rail-active")).toBeInTheDocument()
  })

  it("accepts extra paths that also count as home", () => {
    const { container } = draw(
      <BentoNavRail groups={groups} homeRoute="/bento" homeAliases={["/"]} homeLabel="Home" />,
      "/",
    )

    expect(container.querySelector(".bento-rail-active")).toBeInTheDocument()
  })

  it("marks a section active while inside it", () => {
    const { container } = draw(
      <BentoNavRail groups={groups} homeRoute="/bento" homeLabel="Home" />,
      "/ai/models",
    )

    expect(container.querySelectorAll(".bento-rail-active")).toHaveLength(1)
  })

  it("renders an empty rail rather than failing when a product has no sections", () => {
    draw(<BentoNavRail groups={[]} homeRoute="/bento" homeLabel="Home" />)

    expect(screen.getByRole("link", { name: /Home/ })).toBeInTheDocument()
  })
})

describe("BentoUserMenu", () => {
  const withUser = (ui: ReactElement) =>
    draw(
      <UserProvider fetchUser={() => Promise.resolve({ username: "ana", firstName: "Ana", lastName: "Silva", email: "ana@example.com", admin: false })}>
        {ui}
      </UserProvider>,
    )

  it("shows only the entries whose route the product supplied", async () => {
    const user = userEvent.setup()
    withUser(<BentoUserMenu accountRoute="/account" logoutUrl="/logout" />)

    await user.click(await screen.findByRole("button"))
    const menu = await screen.findByRole("menu")

    expect(menu).toHaveTextContent(/account/i)
    // No organizations route was given, so no organizations entry.
    expect(menu).not.toHaveTextContent(/organizations/i)
    expect(menu).not.toHaveTextContent(/tenant administration/i)
  })

  it("shows the tenancy entries once their routes are given", async () => {
    const user = userEvent.setup()
    withUser(
      <BentoUserMenu
        accountRoute="/account"
        logoutUrl="/logout"
        organizationsRoute="/orgs"
        tenantAdminRoute="/tenants"
      />,
    )

    await user.click(await screen.findByRole("button"))
    const menu = await screen.findByRole("menu")

    expect(menu).toHaveTextContent(/organizations/i)
    expect(menu).toHaveTextContent(/tenant/i)
  })

  it("hides the shortcuts and tour entries when no handler is given", async () => {
    const user = userEvent.setup()
    withUser(<BentoUserMenu accountRoute="/account" logoutUrl="/logout" />)

    await user.click(await screen.findByRole("button"))

    expect(within(await screen.findByRole("menu")).queryByText(/shortcut/i)).not.toBeInTheDocument()
  })

  it("offers the shortcuts entry when one is", async () => {
    const user = userEvent.setup()
    const onOpenShortcuts = vi.fn()
    withUser(
      <BentoUserMenu accountRoute="/account" logoutUrl="/logout" onOpenShortcuts={onOpenShortcuts} />,
    )

    await user.click(await screen.findByRole("button"))
    await user.click(within(await screen.findByRole("menu")).getByText(/shortcut/i))

    expect(onOpenShortcuts).toHaveBeenCalledTimes(1)
  })
})

describe("BentoBackToTop", () => {
  it("renders without any product wiring at all", () => {
    const { container } = draw(<BentoBackToTop />)

    expect(container).toBeTruthy()
  })
})

describe("the shell's layout contract", () => {
  const css = readFileSync(join(resolve(import.meta.dirname), "bento.css"), "utf8")

  it("reserves the rail's gutter at the width the rail actually is", () => {
    // The rail is w-16 (4rem) and hidden below md (48rem); the gutter has to
    // agree on both numbers or content sits under it on one breakpoint.
    expect(css).toMatch(/@media \(min-width: 48rem\)[\s\S]*?\.bento-rail-gutter[\s\S]*?padding-left: 4rem/)
  })

  it("states the no-sidebar rule where a consumer meets it", () => {
    const barrel = readFileSync(join(resolve(import.meta.dirname), "index.ts"), "utf8")

    expect(barrel).toMatch(/no sidebar provider/i)
  })
})
