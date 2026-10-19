import type { Meta, StoryObj } from "@storybook/react-vite"

import "./site.css"

import { SiteButton, SiteFeatureIndex, SiteFooter, SiteHero, SiteNav, SiteSectionHead } from "./site-chrome"
import { SiteCopyButton } from "./site-copy-button"
import { SiteRich } from "./site-rich"
import { SiteSponsor, type SponsorDeclaration } from "./site-sponsor"
import { SiteThemeToggle } from "./site-theme-toggle"

/**
 * VDS214 — a product page composed from `./site`. Switch the toolbar's Tone to
 * `warm` for the clay family; the mode switch is the same `data-theme` the
 * page's own toggle sets. The copy here is placeholder: a product passes its own.
 */
const meta: Meta = {
  title: "Site/Product page",
  parameters: { layout: "fullscreen" },
}
export default meta

/** A plain tile, inline so the story never reaches the network. */
const TILE = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="8" rx="2" fill="#888"/></svg>')

const declaration: SponsorDeclaration = {
  sponsor: {
    name: "Sponsor Co",
    url: "https://example.org",
    logo: TILE,
    label: "Sponsored by",
    summary: "Open tools for teams with a lot to publish.",
    siteLabel: "example.org",
  },
  products: [
    { id: "one", name: "Product One", url: "https://example.org/one", logo: TILE, inline: "so readers find what they came for" },
    { id: "two", name: "Product Two", url: "https://example.org/two", logo: TILE, inline: "so a page goes live the same day" },
  ],
}

const brand = { href: "#", name: "Example Tool" }

export const Page: StoryObj = {
  render: () => (
    <div className="vg-site">
      <SiteNav
        brand={brand}
        parent={{ href: "#", name: "family", pre: "part of", title: "The family of tools" }}
        links={[
          { href: "#install", label: "Install" },
          { href: "#features-index", label: "Features" },
        ]}
        actions={
          <>
            <SiteButton href="#install">Download</SiteButton>
            <SiteButton variant="ghost" href="#">
              Repository
            </SiteButton>
            <SiteThemeToggle storageKey="storybook-site-theme" label={(next) => `Switch to ${next} theme`} />
          </>
        }
      />
      <main>
        <SiteHero
          badge="Open source · Windows 10 / 11"
          title="Says what it does,"
          titleAccent="in one line."
          sub={<SiteRich runs={["Reads the ", { code: "config.json" }, " it finds and ", { b: "nothing else" }, "."]} />}
          actions={
            <>
              <SiteButton href="#install">Install</SiteButton>
              <SiteButton variant="ghost" href="#">
                View the source
              </SiteButton>
            </>
          }
          meta={["No API key", "No admin rights", "In-app updates"]}
          pills={[
            <SiteRich key="a" runs={[{ b: "Burn rate" }, " projected"]} />,
            <SiteRich key="b" runs={[{ b: "Cost" }, " per session"]} />,
          ]}
        />
        <section className="vg-site-section" id="install">
          <div className="vg-site-wrap">
            <SiteSectionHead eyebrow="Install" title="One command">
              Run it once; the tool updates itself after that.
            </SiteSectionHead>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <SiteCopyButton text="winget install example.tool" label="Copy the install command" copyLabel="Copy" copiedLabel="Copied!" />
            </div>
          </div>
        </section>
        <SiteFeatureIndex
          eyebrow="In depth"
          title="One page per pillar"
          goLabel="Read the page →"
          description="Each section has a page to link to."
          items={[
            { href: "#projection", heading: "Projection", description: "When the limit lands at the current pace." },
            { href: "#statistics", heading: "Statistics", description: "What each session cost, at list prices." },
          ]}
        />
      </main>
      <SiteFooter
        brand={brand}
        links={[
          { href: "#privacy", label: "Privacy" },
          { href: "#releases", label: "Releases" },
        ]}
        sponsor={<SiteSponsor declaration={declaration} moreLabel="More at" />}
        disclaimer="Placeholder copy. A product passes its own disclaimer."
      />
    </div>
  ),
}
