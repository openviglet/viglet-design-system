/**
 * The bento layer — the second era of chrome this package ships.
 *
 * Deliberately a subpath rather than part of the root barrel. A consumer still
 * on console chrome should not carry this in its bundle, and an import that
 * says `@viglet/viglet-design-system/bento` states which era a page belongs to,
 * which is something a reviewer and a lint can both see.
 *
 * The stylesheet is a separate entry rather than imported from here, so that a
 * consumer taking only the layout maths does not pull CSS it never renders:
 *
 *   import "@viglet/viglet-design-system/bento.css"
 *
 * The shell is three pieces and no provider: BentoNavRail down the left,
 * BentoUserMenu in the header, BentoBackToTop at the corner. Wrap the routed
 * page in `bento-rail-gutter` so content clears the rail.
 *
 * There is deliberately no sidebar provider here, and no context between them.
 * The console era needs one because its sidebar collapses, remembers and
 * pushes content around; the rail does none of that -- it is fixed, it is one
 * width, and it is hidden below md. A provider would be state nothing reads.
 *
 * docs/BENTO-AUTHORING.md is the contract for writing a page with these, and
 * docs/BENTO-BOUNDARY.md says which of the product's bento exports belong here
 * and which stay in the product.
 */

// The leaf components — what a page composes. Props are unchanged from the
// product they grew in, so a page moving to the package changes its imports
// and nothing else.
export { BentoActionsMenu, type BentoActionsMenuItem, type BentoActionsMenuProps, type BentoActionTone } from "./bento-actions-menu";
export { BentoCountTile, type BentoCountTileProps } from "./bento-count-tile";
export { BentoEmptyState, type BentoEmptyStateProps } from "./bento-empty-state";
export {
  BentoEntityShell,
  type BentoEntityShellProps,
  type BentoEntityShellRenderArgs,
  type BentoIdentity,
  type BentoShellFormState,
} from "./bento-entity-shell";
export { BentoEntityTile, type BentoEntityTileProps } from "./bento-entity-tile";
export {
  BentoListPage,
  type BentoListPageProps,
  type BentoListLayout,
  BentoTileGrid,
  type BentoTileGridProps,
} from "./bento-list-page";
export { BentoHeroIconPicker, type BentoHeroIconPickerProps } from "./bento-hero-icon-picker";
export { BentoInlineEdit, type BentoInlineEditProps } from "./bento-inline-edit";
export { BentoFormHero, type BentoFormHeroProps } from "./bento-form-hero";
export { BentoFormSection, type BentoFormSectionProps } from "./bento-form-section";
export { BentoBackToTop } from "./bento-back-to-top";
export { BentoCommandPalette, type BentoCommandPaletteProps } from "./bento-command-palette";
export { BentoShortcutsDialog, type BentoShortcutsDialogProps } from "./bento-shortcuts-dialog";
export { BentoNavRail, type BentoNavRailProps } from "./bento-nav-rail";
export { BentoUserMenu, type BentoUserMenuProps } from "./bento-user-menu";
export {
  bentoNavTarget,
  type BentoNavGroup,
  type BentoNavItem,
  type BentoNavSection,
  type BentoNavSectionId,
} from "./bento-nav";
export { BentoBackLink, BentoHero, type BentoHeroProps } from "./bento-hero";
export { BentoSaveBar, type BentoSaveBarProps } from "./bento-save-bar";
export { useBentoScrollFade } from "./bento-scroll-fade";
export { BentoScrollSaveBar } from "./bento-scroll-save-bar";
export {
  AdaptiveSectionCard,
  type AdaptiveSectionCardProps,
  SectionCardChromeProvider,
  type SectionChrome,
  useSectionChrome,
} from "./bento-section-chrome";
export { BentoSection, type BentoSectionProps } from "./bento-section";
export { BentoStatusMarker, type BentoStatusMarkerProps } from "./bento-status-marker";
export { BentoTile, type BentoTileProps } from "./bento-tile";

export {
  BENTO_TONES,
  BENTO_TONE_CLASS,
  bentoChipClass,
  type BentoTone,
} from "./bento-tones";
export {
  BENTO_EMPHASIS_NEXT,
  BENTO_EMPHASIS_SPAN,
  resolveBentoLayout,
  toBentoLayoutEntries,
  type BentoEmphasis,
  type BentoLayoutEntry,
  type BentoLayoutResponse,
  type BentoLayoutSource,
  type ResolvedBentoItem,
} from "./bento-layout";
