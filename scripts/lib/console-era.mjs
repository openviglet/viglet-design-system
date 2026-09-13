/**
 * The console page vocabulary, and the bento export a page reaches for instead.
 * This is the swap table the README publishes, held as data so the removal
 * guard in src/components/router/console-era.test.ts and the chrome census in
 * scripts/chrome-census.mjs read one list: a second copy is the one a rename
 * never reaches.
 *
 * VDS147 removed all eleven, so this is now a table of names that are gone. It
 * outlives them on purpose: the census still counts a consumer reaching for one,
 * and the guard still asserts that none of them came back. A name here is the
 * one thing a product author can search for and be told where it went.
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
 * imports them itself, so removing them would remove part of bento. Since
 * VDS147 they are the whole of `./router`.
 */
export const ERA_NEUTRAL = ["DialogDelete", "LoadProvider", "GradientButtonLink"]
