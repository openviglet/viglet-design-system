import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2, IconSearch } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { Link, MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { VigletAssistant } from "@/components/ui/viglet-assistant"
import { UserProvider } from "@/contexts/user.context"

import {
  BentoBackToTop,
  BentoNavRail,
  BentoShell,
  BentoUserMenu,
  type BentoNavGroup,
  type BentoShellColumn,
} from "./index"

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

// VDS131 — the component the contract gives the reading column to. What the
// column measures in a browser is bento-shell.parity.test.tsx; this is the
// structure and the ownership.
describe("BentoShell", () => {
  it("renders one main, and the page inside it", () => {
    const { container } = draw(
      <BentoShell>
        <p>the page</p>
      </BentoShell>,
    )

    expect(container.querySelectorAll("main")).toHaveLength(1)
    expect(screen.getByRole("main")).toContainElement(screen.getByText("the page"))
  })

  it("names the column on main, default unless asked", () => {
    const { rerender } = draw(<BentoShell>page</BentoShell>)
    expect(screen.getByRole("main")).toHaveAttribute("data-column", "default")

    for (const column of ["narrow", "wide", "full"] satisfies BentoShellColumn[]) {
      rerender(
        <I18nextProvider i18n={i18next}>
          <MemoryRouter>
            <BentoShell column={column}>page</BentoShell>
          </MemoryRouter>
        </I18nextProvider>,
      )
      expect(screen.getByRole("main")).toHaveAttribute("data-column", column)
    }
  })

  it("reserves the rail's gutter only when it is given a rail", () => {
    const bare = draw(<BentoShell>page</BentoShell>)
    expect(bare.container.querySelector("[data-slot='bento-shell']")).not.toHaveClass("bento-rail-gutter")
    bare.unmount()

    const railed = draw(
      <BentoShell rail={<BentoNavRail groups={groups} homeRoute="/bento" homeLabel="Home" />}>page</BentoShell>,
    )
    const shell = railed.container.querySelector("[data-slot='bento-shell']")
    expect(shell).toHaveClass("bento-rail-gutter")
    expect(shell).toContainElement(screen.getByRole("navigation"))
  })

  it("lays the header out edge to edge, and renders none without a slot", () => {
    const bare = draw(<BentoShell>page</BentoShell>)
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
    bare.unmount()

    draw(
      <BentoShell headerStart={<a href="/">Mark</a>} headerEnd={<button type="button">Account</button>}>
        page
      </BentoShell>,
    )
    const header = screen.getByRole("banner")
    const [start, end] = Array.from(header.children)
    expect(start).toContainElement(screen.getByRole("link", { name: "Mark" }))
    expect(end).toContainElement(screen.getByRole("button", { name: "Account" }))
  })

  it("puts the back-to-top control at the corner unless told otherwise", () => {
    const withDefault = draw(<BentoShell>page</BentoShell>)
    expect(screen.getByRole("button", { name: /back ?to ?top/i })).toBeInTheDocument()
    withDefault.unmount()

    const { container } = draw(<BentoShell backToTop={false}>page</BentoShell>)
    expect(screen.queryByRole("button", { name: /back ?to ?top/i })).not.toBeInTheDocument()
    // Nothing in the corner, so no stack either.
    expect(container.querySelector("[data-slot='bento-shell-corner']")).toBeNull()
  })

  // VDS133 — one corner, two tenants. Where their boxes land is measured in
  // bento-shell.parity.test.tsx; this is who holds the corner.
  it("stacks the back-to-top control above the dock, both in flow", () => {
    const { container } = draw(
      <BentoShell dock={<VigletAssistant caption="Ready" />}>page</BentoShell>,
    )
    const corner = container.querySelector<HTMLElement>("[data-slot='bento-shell-corner']")!
    const backToTop = screen.getByRole("button", { name: /back ?to ?top/i })
    const dock = screen.getByRole("button", { name: /assistant\.open|open/i }).parentElement!.parentElement!

    expect(corner).toHaveClass("fixed", "pointer-events-none")
    expect(corner.firstElementChild).toBe(backToTop)
    expect(corner.lastElementChild).toBe(dock)
    // Neither fixes itself to the viewport while the shell holds the corner.
    expect(backToTop).not.toHaveClass("fixed")
    expect(dock).not.toHaveClass("fixed")
    expect(dock).toHaveClass("pointer-events-auto")
    expect(screen.getByRole("main")).not.toContainElement(dock)
  })

  it("leaves both in their own corner outside a shell", () => {
    draw(
      <>
        <BentoBackToTop />
        <VigletAssistant caption="Ready" />
      </>,
    )

    expect(screen.getByRole("button", { name: /back ?to ?top/i })).toHaveClass("fixed")
    expect(
      screen.getByRole("button", { name: /assistant\.open|open/i }).parentElement!.parentElement!,
    ).toHaveClass("fixed")
  })
})

// VDS141 — the landmark, the way past the rail, and focus on navigation, owned
// by the shell so no page implements them for itself.
describe("BentoShell's landmarks and focus", () => {
  it("renders one labelled main, and a skip link as the first thing a keyboard reaches", async () => {
    const user = userEvent.setup()
    draw(
      <BentoShell rail={<BentoNavRail groups={groups} homeRoute="/bento" homeLabel="Home" />} headerEnd={<button type="button">Account</button>}>
        <h1>Page</h1>
      </BentoShell>,
    )

    const mains = screen.getAllByRole("main")
    expect(mains).toHaveLength(1)
    expect(mains[0]).toHaveAccessibleName(/main/i)

    await user.tab()
    const skip = screen.getByRole("link", { name: /skip/i })
    expect(skip).toHaveFocus()
    expect(skip).toHaveAttribute("href", `#${mains[0].id}`)

    await user.keyboard("{Enter}")
    expect(mains[0]).toHaveFocus()
  })

  it("moves focus to the new page's heading and says its title on navigation, and not on load", async () => {
    const user = userEvent.setup()
    render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter initialEntries={["/one"]}>
          <BentoShell>
            <Routes>
              <Route path="/one" element={<><h1>First page</h1><Link to="/two">Next</Link></>} />
              <Route path="/two" element={<h1>Second page</h1>} />
            </Routes>
          </BentoShell>
        </MemoryRouter>
      </I18nextProvider>,
    )

    // Opening a page takes nothing from where the browser put focus.
    expect(document.body).toHaveFocus()

    await user.click(screen.getByRole("link", { name: "Next" }))
    const heading = await screen.findByRole("heading", { name: "Second page" })
    await waitFor(() => expect(heading).toHaveFocus())
    const statuses = screen.getAllByRole("status")
    expect(statuses.some((s) => s.textContent === "Second page")).toBe(true)
  })

  it("lands on main when the new page has no h1", async () => {
    const user = userEvent.setup()
    render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter initialEntries={["/one"]}>
          <BentoShell backToTop={false}>
            <Routes>
              <Route path="/one" element={<Link to="/two">Next</Link>} />
              <Route path="/two" element={<p>No heading here</p>} />
            </Routes>
          </BentoShell>
        </MemoryRouter>
      </I18nextProvider>,
    )

    await user.click(screen.getByRole("link", { name: "Next" }))
    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus(), { timeout: 2000 })
  })
})

describe("the shell's layout contract", () => {
  const css = readFileSync(join(resolve(import.meta.dirname), "bento.css"), "utf8")

  it("keys each named column to a custom property rather than a class", () => {
    expect(css).toMatch(/\.bento-shell-main\s*\{[^}]*max-width: var\(--bento-column\)/)
    expect(css).toMatch(/\.bento-shell-main\s*\{[^}]*padding: var\(--bento-shell-rhythm\) var\(--bento-shell-gutter\)/)
    for (const column of ["narrow", "wide"]) {
      expect(css).toMatch(
        new RegExp(String.raw`\.bento-shell-main\[data-column="${column}"\]\s*\{\s*--bento-column: var\(--bento-column-${column}\)`),
      )
    }
  })

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
