// Styles
import "./styles/index.css";

// Components
export * from "./components";

// Hooks
export * from "./hooks";

// Contexts
export { BreadcrumbProvider, useBreadcrumb, UserProvider, useCurrentUser } from "./contexts";
export type { BreadcrumbItem as VigBreadcrumbItem } from "./contexts";

// Utilities
export * from "./lib";

// Models
export * from "./models";

// i18n
export { registerVigTranslations, vigDesignSystemTranslations, initVigI18n } from "./i18n";

// Styles (import separately via "@viglet/viglet-design-system/styles")
// import "@viglet/viglet-design-system/styles";
