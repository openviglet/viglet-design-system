// Product logos — shipped with the design system so every consumer app
// (cloud, turing, shio, dumont, …) references a single source of truth.
import vigletLogoUrl from "./viglet.png";
import turingLogoUrl from "./turing.png";
import shioLogoUrl from "./shio.png";
import dumontLogoUrl from "./dumont.png";

export { vigletLogoUrl, turingLogoUrl, shioLogoUrl, dumontLogoUrl };

/**
 * Convenience map keyed by product id, matching the `vg-dot-*` utility
 * class names and the institutional palette.
 */
export const productLogos = {
  viglet: vigletLogoUrl,
  turing: turingLogoUrl,
  shio: shioLogoUrl,
  dumont: dumontLogoUrl,
} as const;

export type ProductId = keyof typeof productLogos;
