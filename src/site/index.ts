/**
 * The product-site layer (VDS214): the chrome a prerendered product page shares
 * with its family, built from the package's tokens and styled by `./site.css`.
 *
 * Every component takes its copy as props or children and fetches nothing, so a
 * prerendered page carries every word in its HTML, and none reads `window`
 * while rendering. The ground follows `data-tone` and the mode `data-theme`.
 */
export { SiteButton, SiteFeatureIndex, SiteFooter, SiteHero, SiteNav, SiteSectionHead } from "./site-chrome"
export type { SiteBrand, SiteLink } from "./site-chrome"
export { SiteCopyButton } from "./site-copy-button"
export { SiteRich } from "./site-rich"
export type { SiteRichRuns, SiteRun } from "./site-rich"
export { SiteSponsor } from "./site-sponsor"
export type { SponsorDeclaration } from "./site-sponsor"
export { createSiteTheme, siteThemeScript } from "./site-theme"
export type { SiteTheme, SiteThemeRuntime } from "./site-theme"
export { SiteThemeToggle } from "./site-theme-toggle"
