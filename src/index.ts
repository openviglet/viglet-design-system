// Styles
import "./styles/index.css";

// Components
export * from "./components";

// The product logos live on the `./assets` subpath, not here. Vite's library
// mode inlines every asset regardless of assetsInlineLimit, so a re-export from
// this barrel put 1.90 MB of base64 PNG into the root entry — 1.24 MB of it
// `viglet.png`, which nothing in this package renders and no consumer imports.
// Reachability was the whole cost: `productLogos` names all four, so keeping
// the map here inlined all four.
//
//   import { productLogos } from "@viglet/viglet-design-system/assets";

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
