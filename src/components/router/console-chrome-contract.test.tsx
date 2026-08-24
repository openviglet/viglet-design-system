import { render, screen } from "@testing-library/react"
import i18next from "i18next"
import { IconCpu } from "@tabler/icons-react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"

import { SubPage } from "./sub.page"
import type { NavMainItem } from "./internal.sidebar"

/**
 * VDS76 — the contract this chrome had to grow before a product could stop
 * declaring its own copy.
 *
 * Turing carried a fork of `SubPage` and `InternalSidebar` for a year, not
 * because it wanted different chrome but because these two were each narrower
 * in four specific ways. A type-check does not catch any of them: three were
 * props that simply did not exist, and the fourth is an active-state rule where
 * both versions compile and one lights the wrong row. So what is asserted here
 * is the behaviour a shim depends on.
 */

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function ContextProbe() {
  const ctx = useOutletContext<{ token: string } | null>()
  return <div data-testid="probe">{ctx?.token ?? "no-context"}</div>
}

function renderShell(
  props: Partial<React.ComponentProps<typeof SubPage>> = {},
  path = "/base",
) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="*"
            element={<SubPage icon={IconCpu} feature="Feature" name="Name" {...props} />}
          >
            <Route path="*" element={<ContextProbe />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe("SubPage passes its outlet context down", () => {
  it("hands the value to a routed child", () => {
    renderShell({ urlBase: "/base", outletContext: { token: "shared-form" } })
    expect(screen.getByTestId("probe")).toHaveTextContent("shared-form")
  })

  it("hands nothing down when the caller supplies nothing", () => {
    renderShell({ urlBase: "/base" })
    expect(screen.getByTestId("probe")).toHaveTextContent("no-context")
  })
})

describe("SubPage density", () => {
  // The default is what every console already renders, so adopting this
  // component must not move a page that did not ask to be moved.
  it("defaults to the comfortable spacing this component has always used", () => {
    const { container } = renderShell({ urlBase: "/base" })
    const outer = container.querySelector("div.w-full")
    expect(outer?.className).toContain("md:px-6")
    expect(outer?.className).toContain("lg:px-8")
  })

  it("drops the outer padding when a product asks for compact", () => {
    const { container } = renderShell({ urlBase: "/base", density: "compact" })
    const outer = container.querySelector("div.w-full")
    expect(outer?.className).toContain("px-0")
    expect(outer?.className).not.toContain("lg:px-8")
  })
})

describe("InternalSidebar nav items", () => {
  const grouped: NavMainItem[] = [
    { title: "Detail", url: "/detail" },
    { title: "Field", url: "/field" },
    { title: "Field coverage", url: "/field-coverage" },
    { title: "Advanced", children: [{ title: "Nested", url: "/nested" }] },
  ]

  it("renders an item with children and no url as a heading, not a link", () => {
    renderShell({ urlBase: "/base", data: { navMain: grouped } })
    // The heading is present, and it is not something you can navigate to.
    expect(screen.getByText("Advanced")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Advanced" })).not.toBeInTheDocument()
    // Its children are still reachable.
    expect(screen.getByRole("link", { name: "Nested" })).toBeInTheDocument()
  })

  it("marks active on a segment boundary, so /field does not light on /field-coverage", () => {
    renderShell({ urlBase: "/base", data: { navMain: grouped } }, "/base/field-coverage")
    const field = screen.getByRole("link", { name: "Field" })
    const coverage = screen.getByRole("link", { name: "Field coverage" })
    // `startsWith` alone would light both, because one path is a prefix of the
    // other — that is the bug this rule exists to avoid.
    expect(coverage.closest("[data-active]")).toHaveAttribute("data-active", "true")
    expect(field.closest("[data-active]")).not.toHaveAttribute("data-active", "true")
  })

  it("keeps only the detail item while an entity is new, by default", () => {
    renderShell({ urlBase: "/base", isNew: true, data: { navMain: grouped } })
    expect(screen.getByRole("link", { name: "Detail" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Field" })).not.toBeInTheDocument()
  })

  it("keeps an item marked showOnNew, which the url heuristic would have dropped", () => {
    const withFlag: NavMainItem[] = [
      { title: "Detail", url: "/detail" },
      { title: "Variables", url: "/variables", showOnNew: true },
      { title: "History", url: "/history" },
    ]
    renderShell({ urlBase: "/base", isNew: true, data: { navMain: withFlag } })
    expect(screen.getByRole("link", { name: "Variables" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "History" })).not.toBeInTheDocument()
  })
})
