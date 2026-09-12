import type { HTMLAttributes, CSSProperties } from "react";
import { cn } from "../../lib/utils";
import "./glass-card.css";

/**
 * GlassCard — glassmorphism container used by login, onboarding and hero
 * cards across Viglet products.
 *
 * Ships with sensible defaults for every visible surface concern (rounded
 * corners, responsive padding) so consumers compose it without restating the
 * same utility classes. Pass any Tailwind override via `className` — the merge
 * is done with `tailwind-merge` so the last declaration of a conflicting
 * utility (e.g. `p-4` overriding the default `p-6 sm:p-8`) wins.
 *
 * The shadow tint follows `color` / `colorDark`. With neither, the light shadow
 * still takes `--ff-color-rgb` from an ancestor {@link FloatingFormulasBg}, so a
 * card inside one matches the surrounding palette without being told to.
 */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Accent colour for the shadow tint — any CSS colour. Also tints the dark
   * shadow unless `colorDark` says otherwise.
   */
  color?: string;
  /** Accent colour for the shadow tint in dark mode. */
  colorDark?: string;
}

const DEFAULT_SURFACE = "rounded-2xl p-6 sm:p-8";

export function GlassCard({
  children,
  color,
  colorDark,
  className,
  style,
  ...rest
}: Readonly<GlassCardProps>) {
  const themeStyle: Record<string, string> = {};
  if (color) themeStyle["--glass-card-color"] = color;
  if (colorDark) themeStyle["--glass-card-color-dark"] = colorDark;
  else if (color) themeStyle["--glass-card-color-dark"] = color;

  return (
    <div
      className={cn("vig-glass-card", DEFAULT_SURFACE, className)}
      style={{ ...(style ?? {}), ...themeStyle } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
