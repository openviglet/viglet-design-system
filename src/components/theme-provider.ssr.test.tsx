// @vitest-environment node
//
// VDS72 — the environment is the assertion. There is no `window`, no
// `document` and no `localStorage` here, which is what a server render is and
// what the old provider could not survive: it seeded `useState` with
// `localStorage.getItem(...)`, and a `useState` initialiser runs during render.
// A React Server Components consumer failed on the first hook, and one product
// worked around it by never mounting this provider.
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ThemeProvider, useTheme } from "./theme-provider"

function Probe() {
  const { theme } = useTheme()
  return <span data-theme={theme}>rendered</span>
}

describe("ThemeProvider, rendered where there is no DOM", () => {
  it("renders without touching localStorage", () => {
    expect(globalThis.localStorage).toBeUndefined()

    const html = renderToString(
      <ThemeProvider>
        <span>rendered</span>
      </ThemeProvider>,
    )

    expect(html).toContain("rendered")
  })

  it("honours the props this package published", () => {
    const html = renderToString(
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <span>rendered</span>
      </ThemeProvider>,
    )

    expect(html).toContain("rendered")
  })

  it("gives useTheme a defined setting on the server", () => {
    // next-themes reports `theme` as undefined until it has read storage on the
    // client. The three consoles that import this hook type it as the setting,
    // so the server render has to see "system" rather than undefined.
    const html = renderToString(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )

    expect(html).toContain('data-theme="system"')
  })

  it("works with no provider of ours in the tree", () => {
    // What schools does: let next-themes own the class and mount nothing from
    // here. The hook must still answer rather than throw for a missing context.
    const html = renderToString(<Probe />)

    expect(html).toContain('data-theme="system"')
  })
})
