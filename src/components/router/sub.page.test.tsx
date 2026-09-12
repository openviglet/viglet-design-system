import { render } from "@testing-library/react"
import { IconDatabase } from "@tabler/icons-react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it } from "vitest"

import { SubPage } from "./sub.page"

// VDS125 — `SidebarInset` is a `<main>` and `SubPage` rendered another inside
// it, so every console entity page in all three products had two main
// landmarks, one nested in the other and neither named. It survived because the
// component has no story and the accessibility gate only reads those.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function draw(density?: "comfortable" | "compact") {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>
        <SubPage
          icon={IconDatabase}
          feature="Connector"
          name="Product catalogue"
          urlBase="/connectors/1"
          density={density}
          data={{ navMain: [{ title: "Overview", url: "/detail" }] }}
        />
      </MemoryRouter>
    </I18nextProvider>,
  )
}

describe("SubPage", () => {
  it("renders exactly one main landmark", () => {
    const { container } = draw()

    expect(container.querySelectorAll("main")).toHaveLength(1)
  })

  it("keeps the one it has at either density", () => {
    const { container } = draw("compact")

    expect(container.querySelectorAll("main")).toHaveLength(1)
    // The landmark is the inset's, which is what carries the page.
    expect(container.querySelector("main")).toHaveAttribute("data-slot", "sidebar-inset")
  })
})
