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
 * docs/BENTO-BOUNDARY.md says which of the product's bento exports belong here
 * and which stay in the product.
 */

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
