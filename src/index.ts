// Styles
import "./styles/index.css";

// Components
export * from "./components";

// Product logos (PNG assets bundled with the design system)
export {
  vigletLogoUrl,
  turingLogoUrl,
  shioLogoUrl,
  dumontLogoUrl,
  productLogos,
  type ProductId,
} from "./assets/products";

// Hooks
export * from "./hooks";

// Contexts
export { BreadcrumbProvider, useBreadcrumb, useBreadcrumbOptional, UserProvider, useCurrentUser } from "./contexts";
export type { BreadcrumbItem as VigBreadcrumbItem } from "./contexts";

// Utilities
export * from "./lib";

// Models
export * from "./models";

// i18n
export { registerVigTranslations, vigDesignSystemTranslations, initVigI18n } from "./i18n";

// Styles (import separately via "@viglet/viglet-design-system/styles")
// import "@viglet/viglet-design-system/styles";
