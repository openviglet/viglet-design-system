/**
 * Colour tones for bento tiles.
 *
 * A tone names the gradient on the icon chip; the surface behind it stays
 * frosted and neutral so the two never compete. What a tone *is* lives in CSS:
 * `bento.css` maps each name to `--bento-tone-from` / `--bento-tone-to`, which
 * resolve from `--vg-bento-tone-<name>-*` in the preset.
 *
 * That indirection is the point. These used to be Tailwind colour classes baked
 * into the components, so the palette belonged to this package rather than to
 * the product rendering it — and Turing is blue where Shio is orange. A product
 * re-keys a tone by redefining two custom properties, and forks nothing.
 */

export type BentoTone =
  | "blue"
  | "indigo"
  | "violet"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

/**
 * The class that carries a tone. Pair it with `bento-chip`, which is what
 * paints the gradient:
 *
 * ```tsx
 * <span className={`bento-chip ${BENTO_TONE_CLASS[tone]}`} />
 * ```
 */
export const BENTO_TONE_CLASS: Record<BentoTone, string> = {
  blue: "bento-tone-blue",
  indigo: "bento-tone-indigo",
  violet: "bento-tone-violet",
  emerald: "bento-tone-emerald",
  amber: "bento-tone-amber",
  rose: "bento-tone-rose",
  slate: "bento-tone-slate",
};

/** Every tone this package defines, in the order the palette reads. */
export const BENTO_TONES = Object.keys(BENTO_TONE_CLASS) as BentoTone[];

/**
 * The class list for a chip of the given tone. `slate` is the fallback for an
 * unknown value, which is what the chip's own CSS falls back to as well — a tile
 * with a bad tone should look plain, not unstyled.
 */
export function bentoChipClass(tone: BentoTone | undefined): string {
  return `bento-chip ${BENTO_TONE_CLASS[tone as BentoTone] ?? BENTO_TONE_CLASS.slate}`;
}
