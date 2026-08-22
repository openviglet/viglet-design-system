import type { Icon as TablerIcon } from "@tabler/icons-react";

import type { BentoTone } from "./bento-tones";

/**
 * The shape of a navigation entry, without the entries.
 *
 * The rail, the hubs and the command palette all render the same thing, and
 * what they render is one product's map of itself: its routes, its entity
 * names, its sections. So the schema lives here and the array lives in the
 * product — a package holding the array would offer Turing's routes inside a
 * Shio console. viglet-ds-consumer-pair -- two products contrasted, not the
 * consumer set enumerated.
 *
 * This is the *render* contract, deliberately narrower than what a product
 * keeps. Visibility is a product concern: privileges, licences and which
 * capabilities are switched on are all things only the product can answer, and
 * it answers them before handing over a list. Carry those fields on your own
 * type and pass the result:
 *
 * ```ts
 * interface MyNavItem extends BentoNavItem { privilege?: string }
 * const visible: BentoNavItem[] = all.filter(canSee)
 * ```
 */

/** Which band of the rail a section belongs to; a product names its own. */
export type BentoNavSectionId = string;

export interface BentoNavSection {
  id: BentoNavSectionId;
  /** i18n key for the section label. A section with none renders unlabelled. */
  labelKey?: string;
  /** i18n key for the section description, shown on a hub. */
  descriptionKey?: string;
  /** Icon shown for this section on the nav rail. */
  icon?: TablerIcon;
  /**
   * The section's hub page. The rail links here and the hub renders every
   * visible item of the section as a mosaic. A section without one is reached
   * through its items alone.
   */
  areaRoute?: string;
}

export interface BentoNavItem {
  id: string;
  /** i18n key for the item label. */
  titleKey: string;
  /** i18n key for the item description, shown as the tile body. */
  descriptionKey: string;
  icon: TablerIcon;
  section: BentoNavSectionId;
  /** Tile tone on the mosaic. */
  tone: BentoTone;
  /** Grid span on the mosaic. Defaults to a 1×1 square when omitted. */
  span?: string;
  /**
   * Where this surface lives. Optional because a product mid-migration may not
   * have moved it yet, in which case {@link BentoNavItem.fallbackRoute} is
   * where the palette and the hubs send a reader instead.
   */
  bentoRoute?: string;
  /** Where to go while a surface has no bento route of its own. */
  fallbackRoute: string;
}

/** One section and the items a product decided are visible in it. */
export interface BentoNavGroup {
  section: BentoNavSection;
  items: BentoNavItem[];
}

/** Where an item points: its own route if it has one, its fallback otherwise. */
export function bentoNavTarget(item: BentoNavItem): string {
  return item.bentoRoute ?? item.fallbackRoute;
}
