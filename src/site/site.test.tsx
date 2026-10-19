import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { SiteCopyButton, SiteRich, SiteSponsor, SiteThemeToggle, createSiteTheme, siteThemeScript } from "./index"
import type { SponsorDeclaration } from "./index"

function preferDark(dark: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({ matches: dark && query.includes("dark"), media: query })),
  )
}

/** A storage that behaves like the browser's, since this environment has none. */
function memoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, String(value)),
  }
}

beforeEach(() => {
  vi.stubGlobal("localStorage", memoryStorage())
})

afterEach(() => {
  cleanup()
  delete document.documentElement.dataset.theme
  vi.unstubAllGlobals()
})

describe("the site theme", () => {
  it("follows the OS until a choice is stored, then the choice", () => {
    preferDark(true)
    const theme = createSiteTheme("tool-theme")
    expect(theme.effective()).toBe("dark")

    expect(theme.toggle()).toBe("light")
    expect(document.documentElement.dataset.theme).toBe("light")
    expect(localStorage.getItem("tool-theme")).toBe("light")
    expect(theme.effective()).toBe("light")
  })

  it("keeps each product's choice under its own key", () => {
    createSiteTheme("one-theme").apply("dark")
    expect(createSiteTheme("two-theme").stored()).toBeNull()
  })

  it("writes a pre-paint script that applies the stored choice, else the OS", () => {
    preferDark(true)
    new Function(siteThemeScript("tool-theme"))()
    expect(document.documentElement.dataset.theme).toBe("dark")

    localStorage.setItem("tool-theme", "light")
    new Function(siteThemeScript("tool-theme"))()
    expect(document.documentElement.dataset.theme).toBe("light")
  })

  it("still sets the attribute where storage is unavailable", () => {
    vi.stubGlobal("localStorage", undefined)
    preferDark(true)
    const theme = createSiteTheme("tool-theme")
    expect(theme.effective()).toBe("dark")
    expect(theme.toggle()).toBe("light")
    expect(document.documentElement.dataset.theme).toBe("light")
  })

  it("quotes the key, so a key cannot break out of the script", () => {
    expect(siteThemeScript('a"b')).toContain(JSON.stringify('a"b'))
  })
})

describe("SiteThemeToggle", () => {
  it("names the theme a click switches to, and switches it", async () => {
    preferDark(false)
    render(<SiteThemeToggle storageKey="tool-theme" label={(next) => `Switch to ${next} theme`} />)

    const button = screen.getByRole("button", { name: "Switch to dark theme" })
    fireEvent.click(button)
    expect(document.documentElement.dataset.theme).toBe("dark")
    expect(localStorage.getItem("tool-theme")).toBe("dark")
    expect(await screen.findByRole("button", { name: "Switch to light theme" })).toBeTruthy()
  })

  it("follows the attribute when something else sets it", async () => {
    preferDark(false)
    render(<SiteThemeToggle storageKey="tool-theme" label={(next) => `Switch to ${next} theme`} />)
    document.documentElement.dataset.theme = "dark"
    expect(await screen.findByRole("button", { name: "Switch to light theme" })).toBeTruthy()
  })
})

describe("SiteCopyButton", () => {
  it("copies its text and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", { clipboard: { writeText } })
    render(<SiteCopyButton text="tool install" label="Copy the install command" copyLabel="Copy" copiedLabel="Copied!" />)

    fireEvent.click(screen.getByRole("button", { name: "Copy the install command" }))
    expect(await screen.findByText("Copied!")).toBeTruthy()
    expect(writeText).toHaveBeenCalledWith("tool install")
  })
})

describe("SiteRich", () => {
  it("renders runs as text, code, bold and italic, through a transform", () => {
    const { container } = render(
      <p>
        <SiteRich
          runs={["Version {v} ", { code: "run {v}" }, { b: "bold" }, { i: "lean" }]}
          transform={(text) => text.replaceAll("{v}", "1.2")}
        />
      </p>,
    )
    expect(container.innerHTML).toBe("<p>Version 1.2 <code>run 1.2</code><b>bold</b><i>lean</i></p>")
  })
})

describe("SiteSponsor", () => {
  const declaration: SponsorDeclaration = {
    sponsor: { name: "Sponsor Co", url: "https://s.example", logo: "s/logo.png", label: "Sponsored by", summary: "Summary.", siteLabel: "s.example" },
    products: [
      { id: "a", name: "A", url: "https://a.example", logo: "https://cdn.example/a.png", inline: "a clause" },
      { id: "b", name: "B", url: "https://b.example", logo: "s/b.png", inline: "b clause" },
    ],
  }

  it("names the products asked for, in that order, and leaves an absolute logo alone", () => {
    const { container } = render(<SiteSponsor declaration={declaration} assetBase="/tool/" products={["b", "a"]} moreLabel="More at" />)
    const logos = () => Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"))
    const names = screen.getAllByRole("link").map((a) => a.textContent)
    expect(names.filter((n) => n === "Bb clause" || n === "Aa clause")).toEqual(["Bb clause", "Aa clause"])
    expect(logos()).toEqual(["/tool/s/logo.png", "/tool/s/b.png", "https://cdn.example/a.png"])
  })

  it("leaves a root-relative path and a data URI where they are", () => {
    const own = {
      ...declaration,
      sponsor: { ...declaration.sponsor, logo: "/shared/logo.png" },
      products: [{ ...declaration.products[1], logo: "data:image/png;base64,AA==" }],
    }
    const { container } = render(<SiteSponsor declaration={own} assetBase="/tool/" moreLabel="More at" />)
    expect(Array.from(container.querySelectorAll("img")).map((img) => img.getAttribute("src"))).toEqual([
      "/shared/logo.png",
      "data:image/png;base64,AA==",
    ])
  })

  it("names every product when the declaration says nothing about which", () => {
    render(<SiteSponsor declaration={declaration} moreLabel="More at" />)
    expect(screen.getByText("a clause")).toBeTruthy()
    expect(screen.getByText("b clause")).toBeTruthy()
  })
})
