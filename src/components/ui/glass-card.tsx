import type { HTMLAttributes, CSSProperties } from "react";
import { cn } from "../../lib/utils";
import "./glass-card.css";

/**
 * GlassCard — glassmorphism container used by login, onboarding and hero
 * cards across Viglet products.
 *
 * Ships with sensible defaults for every visible surface concern (rounded
 * corners, responsive padding) so consumers compose it without restating the
 * same utility classes. Tint is driven by the `--ff-color-rgb` custom
 * property set by {@link FloatingFormulasBg} so the card shadow matches the
 * surrounding palette. Pass any Tailwind override via `className` — the merge
 * is done with `tailwind-merge` so the last declaration of a conflicting
 * utility (e.g. `p-4` overriding the default `p-6 sm:p-8`) wins.
 */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color for the shadow tint (CSS `color` or `rgb(...)` value). */
  color?: string;
  /** Accent color in dark mode. */
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
