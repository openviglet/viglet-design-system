// @vitest-environment node
//
// VDS214 — the environment is the assertion. A product site is prerendered, so
// every component in `./site` has to render where there is no `window`, no
// `document` and no `localStorage`, and the words it was given have to be in
// the HTML it returns, because that HTML is what a crawler reads.
import { renderToString } from "react-dom/server"
import { describe, expect, it } from "vitest"

import {
  SiteButton,
  SiteCopyButton,
  SiteFeatureIndex,
  SiteFooter,
  SiteHero,
  SiteNav,
  SiteRich,
  SiteSectionHead,
  SiteSponsor,
  SiteThemeToggle,
  type SponsorDeclaration,
} from "./index"

const declaration: SponsorDeclaration = {
  sponsor: {
    name: "Sponsor Co",
    url: "https://sponsor.example",
    logo: "sponsor/logo.png",
    label: "Sponsored by",
    summary: "Tools for teams with a lot to publish.",
    siteLabel: "sponsor.example",
  },
  products: [
    { id: "one", name: "Product One", url: "https://one.example", logo: "sponsor/one.png", inline: "the first clause" },
    { id: "two", name: "Product Two", url: "https://two.example", logo: "sponsor/two.png", inline: "the second clause" },
  ],
  inlineProducts: ["one"],
}

function Page() {
  const brand = { href: "/tool/", name: "Tool", logo: "/tool/logo.png" }
  return (
    <>
      <SiteNav
        brand={brand}
        parent={{ href: "https://family.example/", name: "family", pre: "part of" }}
        links={[{ href: "#install", label: "Install" }]}
        actions={
          <>
            <SiteButton href="#install">Download</SiteButton>
            <SiteThemeToggle storageKey="tool-theme" label={(next) => `Switch to ${next} theme`} />
          </>
        }
      />
      <SiteHero
        icon={{ src: "/tool/logo.png", alt: "Tool logo" }}
        badge="Open source"
        title="Says what it does,"
        titleAccent="in one line."
        sub={<SiteRich runs={["Reads ", { code: "config.json" }, " and ", { b: "nothing else" }, "."]} />}
        actions={<SiteButton variant="ghost" href="https://repo.example">Repository</SiteButton>}
        meta={["No setup"]}
        pills={["Windows 11"]}
      />
      <section>
        <SiteSectionHead eyebrow="Install" title="Three steps">
          One command.
        </SiteSectionHead>
        <SiteCopyButton text="tool install" label="Copy the install command" copyLabel="Copy" copiedLabel="Copied!" />
      </section>
      <SiteFeatureIndex
        title="One page per pillar"
        goLabel="Read the page"
        items={[{ href: "/tool/features/a/", heading: "Pillar A", description: "What A does." }]}
      />
      <SiteFooter
        brand={brand}
        links={[{ href: "/tool/privacy/", label: "Privacy" }]}
        sponsor={<SiteSponsor declaration={declaration} assetBase="/tool/" moreLabel="More at" />}
        disclaimer="Not affiliated with anyone."
      />
    </>
  )
}

describe("the site layer, rendered where there is no DOM", () => {
  const html = renderToString(<Page />)

  it("renders with no browser globals at all", () => {
    expect(globalThis.window).toBeUndefined()
    expect(globalThis.localStorage).toBeUndefined()
    expect(html.length).toBeGreaterThan(1000)
  })

  it.each([
    "Tool",
    "part of",
    "Install",
    "Download",
    "Says what it does,",
    "in one line.",
    "<code>config.json</code>",
    "<b>nothing else</b>",
    "No setup",
    "Windows 11",
    "Three steps",
    "One command.",
    "Pillar A",
    "What A does.",
    "Privacy",
    "Sponsor Co",
    "Tools for teams with a lot to publish.",
    "Product One",
    "the first clause",
    "Not affiliated with anyone.",
  ])("carries %s in the served HTML", (text) => {
    expect(html).toContain(text)
  })

  it("names only the products the declaration puts inline, with logos under the asset base", () => {
    expect(html).not.toContain("Product Two")
    expect(html).toContain('src="/tool/sponsor/one.png"')
    expect(html).toContain('src="/tool/sponsor/logo.png"')
  })

  it("marks the hero's call to action for a Markdown twin to drop", () => {
    expect(html).toMatch(/class="vg-site-hero-actions" data-twin="omit"/)
  })

  // VDS226 — a mark that is not a tile opts out of the square, in all three places.
  it("draws the brand and hero images as tiles unless told they are marks", () => {
    expect(html).not.toContain("vg-site-mark")
    const brand = { href: "/", name: "Tool", logo: "/orca.png", logoShape: "mark" as const }
    const marked = renderToString(
      <>
        <SiteNav brand={brand} />
        <SiteHero icon={{ src: "/orca.png", alt: "Tool", logoShape: "mark" }} title="T" />
        <SiteFooter brand={brand} />
      </>,
    )
    expect(marked.match(/<img class="vg-site-mark"/g)).toHaveLength(2)
    expect(marked).toContain('class="vg-site-hero-icon vg-site-mark"')
  })
})
