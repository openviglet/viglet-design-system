// UI primitives
export * from "./ui";

// App-level components
export { AppFooter } from "./app-footer";
export {
  AppSwitcher,
  type AppSwitcherItem,
  type AppSwitcherProps,
} from "./app-switcher";
export { BadgeColorful } from "./badge-colorful";
export { BadgeLocale, getLocaleCountryCode } from "./badge-locale";
export {
  BackendStatusBanner,
  BackendStatusProvider,
  reportBackendOffline,
  reportBackendOnline,
  useBackendStatus,
} from "./backend-status";
export { BlankSlate } from "./blank-slate";
export { ErrorBoundary } from "./error-boundary";
export { DialogDelete, type VigBlockedByItem } from "./dialog.delete";
export { GridList, type ItemActionProps as VigGridItemActionProps } from "./grid.list";
export { InternalSidebar } from "./internal.sidebar";
export { LanguageSelect } from "./language-select";
export {
  LanguageSwitcher,
  type LanguageOption,
  type LanguageSwitcherProps,
} from "./language-switcher";
export { LoadProvider } from "./loading-provider";
export { ModeToggle, ModeToggleSidebar } from "./mode-toggle";
export { NavMain } from "./nav-main";
export { NavSecondary } from "./nav-secondary";
export { NavUser } from "./nav-user";
export { PageContent } from "./page-content";
export { PageHeader } from "./page-header";
export { Page } from "./page";
export { StickyPageHeader } from "./sticky.page.header";
export { SubPage } from "./sub.page";
export { SubPageHeader } from "./sub.page.header";
export { ThemeProvider, useTheme } from "./theme-provider";
export {
  VigletAppSwitcher,
  type VigletAppSwitcherProps,
  type VigletAppSwitcherUrls,
  type VigletProduct,
} from "./viglet-app-switcher";
