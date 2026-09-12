/**
 * The console page vocabulary, and the bento export a new page should reach for
 * instead. This is the swap table the README publishes, held as data so the
 * deprecation guard in src/components/router/console-era.test.ts and the chrome
 * census in scripts/chrome-census.mjs read one list: a second copy is the one a
 * new deprecation never reaches.
 *
 * `Page` and `PageContent` name no single export as their replacement: the page
 * frame is `BentoShell`, which a product composes with its own rail and header
 * rather than swapping in name for name.
 *
 * @type {Readonly<Record<string, string | null>>}
 */
export const CONSOLE_ERA = {
  PageHeader: "BentoHero",
  SubPageHeader: "BentoHero",
  StickyPageHeader: "useBentoScrollFade",
  GridList: "BentoListPage",
  BlankSlate: "BentoEmptyState",
  InternalSidebar: "BentoNavRail",
  NavMain: "BentoNavRail",
  NavUser: "BentoUserMenu",
  SubPage: "BentoEntityShell",
  Page: null,
  PageContent: null,
}

/**
 * Exports from the same barrel that are *not* console-era: the bento layer
 * imports them itself, so marking them deprecated would deprecate bento.
 */
export const ERA_NEUTRAL = ["DialogDelete", "LoadProvider", "GradientButtonLink"]
