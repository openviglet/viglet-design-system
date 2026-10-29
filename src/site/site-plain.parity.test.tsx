import { renderToStaticMarkup } from "react-dom/server"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { page } from "vitest/browser"

import preset from "@/styles/preset.css?raw"
import siteCss from "./site.css?raw"
import { tokensCss } from "../../scripts/lib/tokens-css.mjs"

import { SiteButton, SiteFeatureIndex, SiteFooter, SiteHero, SiteNav } from "./site-chrome"
import { SiteSponsor, type SponsorDeclaration } from "./site-sponsor"
import { SiteThemeToggle } from "./site-theme-toggle"

/**
 * VDS216 — a page with no build takes the site layer from two stylesheets.
 *
 * No Tailwind and no React at runtime: the markup is what a prerender (or a
 * person) writes into an HTML file, and the only CSS is `tokens.css` and
 * `site.css`, exactly as a page would link them. What is asserted is what the
 * browser resolved, on the warm tone and both grounds, and that the tone moves it.
 */

const declaration: SponsorDeclaration = {
  sponsor: { name: "Sponsor Co", url: "https://s.example", logo: "/s.png", label: "Sponsored by", summary: "Summary.", siteLabel: "s.example" },
  products: [{ id: "a", name: "Product A", url: "https://a.example", logo: "/a.png", inline: "a clause" }],
}

const PAGE = renderToStaticMarkup(
  <div className="vg-site">
    <SiteNav brand={{ href: "/", name: "Tool" }} links={[{ href: "#a", label: "A" }]} actions={<SiteButton href="#">Get it</SiteButton>} />
    <SiteHero badge="Open source" title="Says what it does," titleAccent="in one line." sub="Lead." />
    <SiteFeatureIndex title="Pages" goLabel="Read" items={[{ href: "/a/", heading: "A", description: "About A." }]} />
    <SiteFooter brand={{ href: "/", name: "Tool" }} sponsor={<SiteSponsor declaration={declaration} moreLabel="More at" />} />
  </div>,
)

const style = document.createElement("style")
const host = document.createElement("div")
const root = document.documentElement

beforeAll(() => {
  style.textContent = tokensCss(preset) + "\n" + siteCss
  document.head.appendChild(style)
  host.innerHTML = PAGE
  document.body.appendChild(host)
})

afterAll(() => {
  style.remove()
  host.remove()
  delete root.dataset.tone
  delete root.dataset.theme
})

const css = (selector: string) => getComputedStyle(host.querySelector(selector)!)

function under(tone: "cool" | "warm" | "navy", theme: "light" | "dark") {
  root.dataset.tone = tone
  root.dataset.theme = theme
}

describe("the site layer on a page with no build", () => {
  it("lays the page out from site.css alone", () => {
    under("warm", "light")
    expect(css(".vg-site-nav").position).toBe("sticky")
    expect(css(".vg-site-feature-index").display).toBe("grid")
    expect(css(".vg-site-feature-card").borderRadius).toBe("10px")
    expect(css(".vg-site-sponsor").display).toBe("flex")
    expect(css(".vg-site-hero h1").fontWeight).toBe("900")
  })

  it("draws the warm tone on the light ground", () => {
    under("warm", "light")
    expect(css(".vg-site").backgroundColor).toBe("rgb(251, 247, 244)")
    expect(css(".vg-site-hero h1").color).toBe("rgb(29, 20, 8)")
    expect(css(".vg-site-badge").color).toBe("rgb(166, 75, 46)")
    expect(css(".vg-site-nav").borderBottomColor).toBe("rgb(230, 216, 207)")
    // The warm display face is the UI face, which tokens.css carries into :root.
    expect(css(".vg-site-hero h1").fontFamily).toMatch(/^"?Inter/)
  })

  it("draws the warm tone on the dark ground", () => {
    under("warm", "dark")
    expect(css(".vg-site").backgroundColor).toBe("rgb(21, 16, 12)")
    expect(css(".vg-site-hero h1").color).toBe("rgb(244, 236, 228)")
    expect(css(".vg-site-badge").color).toBe("rgb(217, 119, 87)")
  })

  // VDS223 — SiteButton is always an anchor, and the link reset used to outweigh
  // its class, so the primary label took the page's foreground.
  it.each([
    ["warm", "light"],
    ["warm", "dark"],
    ["navy", "light"],
    ["cool", "light"],
  ] as const)("paints the primary button's label white under %s on the %s ground", (tone, theme) => {
    under(tone, theme)
    expect(css("a.vg-site-btn-primary").color).toBe("rgb(255, 255, 255)")
  })

  // VDS225 — a 300px grid track cannot shrink, so on a 320px phone the single
  // card ran to 324px: past the gutter, and past the screen wherever .vg-site's
  // overflow clip is not the scroller. Measured on the card, which the clip hides.
  it("fits the feature index on a 320px phone", async () => {
    under("warm", "light")
    const phone = document.createElement("div")
    phone.innerHTML = renderToStaticMarkup(
      <div className="vg-site">
        <SiteFeatureIndex title="Pages" goLabel="Read" items={[{ href: "/a/", heading: "A", description: "About A." }]} />
      </div>,
    )
    host.hidden = true
    document.body.style.margin = "0"
    document.body.appendChild(phone)
    try {
      await page.viewport(320, 640)
      const index = phone.querySelector<HTMLElement>(".vg-site-feature-index")!
      expect(document.documentElement.clientWidth).toBe(320)
      expect(index.scrollWidth).toBe(index.clientWidth)
      expect(phone.querySelector(".vg-site-feature-card")!.getBoundingClientRect().right).toBe(320 - 24)
      expect(document.documentElement.scrollWidth).toBe(320)
    } finally {
      phone.remove()
      host.hidden = false
      document.body.style.margin = ""
    }
  })

  // VDS228 — the actions never wrapped or hid, so a nav with a chip, two buttons
  // and the toggle ran to 623px on a 390px phone.
  it.each([320, 390])("fits a full nav on a %ipx phone and keeps the primary action", async (width) => {
    under("warm", "light")
    const logo = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32"/></svg>')}`
    const phone = document.createElement("div")
    phone.innerHTML = renderToStaticMarkup(
      <div className="vg-site">
        <SiteNav
          brand={{ href: "/", name: "Quickshell", logo }}
          parent={{ href: "#", name: "alegauss", pre: "part of" }}
          links={[{ href: "#a", label: "A" }]}
          actions={
            <>
              <SiteButton href="#">Download</SiteButton>
              <SiteButton variant="ghost" href="#">
                Repository
              </SiteButton>
              <SiteThemeToggle storageKey="t" label={(next) => `Switch to ${next}`} />
            </>
          }
        />
      </div>,
    )
    host.hidden = true
    document.body.style.margin = "0"
    document.body.appendChild(phone)
    try {
      await page.viewport(width, 640)
      const wrap = phone.querySelector<HTMLElement>(".vg-site-nav .vg-site-wrap")!
      expect(document.documentElement.clientWidth).toBe(width)
      expect(wrap.scrollWidth).toBe(wrap.clientWidth)
      expect(phone.querySelector(".vg-site-nav-links")!.getBoundingClientRect().right).toBeLessThanOrEqual(width - 24)
      const primary = phone.querySelector(".vg-site-btn-primary")!.getBoundingClientRect()
      expect(primary.width).toBeGreaterThan(0)
      expect(primary.right).toBeLessThanOrEqual(width - 24)
      expect(document.documentElement.scrollWidth).toBe(width)
    } finally {
      phone.remove()
      host.hidden = false
      document.body.style.margin = ""
    }
  })

  // VDS226 — a mark taller than it is wide keeps its proportions: the tile's
  // square, corner and box-shadow are the tile's, not every image's.
  it("draws a tall mark at its own width, unrounded, with a shadow that follows it", async () => {
    under("warm", "light")
    const tall = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="40"><rect width="20" height="40"/></svg>')}`
    const brand = { href: "/", name: "Tool", logo: tall, logoShape: "mark" as const }
    const marked = document.createElement("div")
    marked.innerHTML = renderToStaticMarkup(
      <div className="vg-site">
        <SiteNav brand={brand} />
        <SiteHero icon={{ src: tall, alt: "Tool", logoShape: "mark" }} title="T" />
        <SiteFooter brand={brand} />
      </div>,
    )
    document.body.appendChild(marked)
    try {
      await Promise.all([...marked.querySelectorAll("img")].map((img) => img.decode()))
      const box = (selector: string) => {
        const img = marked.querySelector(selector)!
        return { ...img.getBoundingClientRect().toJSON(), style: getComputedStyle(img) }
      }
      const nav = box(".vg-site-brand img")
      expect([nav.width, nav.height, nav.style.borderRadius]).toEqual([16, 32, "0px"])
      const foot = box(".vg-site-foot-brand img")
      expect([foot.width, foot.height, foot.style.borderRadius]).toEqual([15, 30, "0px"])
      const hero = box(".vg-site-hero-icon")
      expect([hero.width, hero.height, hero.style.borderRadius, hero.style.boxShadow]).toEqual([52, 104, "0px", "none"])
      expect(hero.style.filter).toMatch(/^drop-shadow/)
    } finally {
      marked.remove()
    }
  })

  it("moves with the tone: cool is the preset's ground and face", () => {
    under("cool", "light")
    // Chromium reports an oklch() token in its own space rather than as rgb().
    expect(css(".vg-site").backgroundColor).toBe("oklch(1 0 0)")
    expect(css(".vg-site-hero h1").fontFamily).toContain("Plus Jakarta Sans")
    expect(css(".vg-site-badge").color).not.toBe("rgb(166, 75, 46)")
  })
})
