import { render, screen } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it } from "vitest"

import { ModeToggle } from "./mode-toggle"
import { ThemeProvider } from "./theme-provider"

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

describe("ModeToggle", () => {
  // VDS234 — the accent outline read as a focused or selected control on every route.
  it("draws its trigger as a neutral ghost icon, with no accent border at rest", () => {
    render(
      <I18nextProvider i18n={i18next}>
        <ThemeProvider defaultTheme="light">
          <ModeToggle />
        </ThemeProvider>
      </I18nextProvider>,
    )

    const trigger = screen.getByRole("button")
    expect(trigger.className).not.toMatch(/(^|\s)border(-2)?(\s|$)/)
    expect(trigger.className).not.toContain("--vg-accent-fg")
    expect(trigger).toHaveClass("text-muted-foreground", "hover:bg-accent", "focus-visible:ring-[3px]")
  })
})
