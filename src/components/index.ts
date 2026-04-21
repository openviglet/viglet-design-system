// UI primitives
export * from "./ui";

// Hero / onboarding compounds
export * from "./login";
export * from "./startup-first";

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
export { ErrorBoundary } from "./error-boundary";
export { LanguageSelect } from "./language-select";
export {
  LanguageSwitcher,
  type LanguageOption,
  type LanguageSwitcherProps,
} from "./language-switcher";
export { ModeToggle, ModeToggleSidebar } from "./mode-toggle";
export { NavSecondary } from "./nav-secondary";
export { ThemeProvider, useTheme } from "./theme-provider";
export {
  VigletAppSwitcher,
  type VigletAppSwitcherProps,
  type VigletAppSwitcherUrls,
  type VigletProduct,
} from "./viglet-app-switcher";
