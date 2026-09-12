import type { HTMLAttributes, CSSProperties } from "react";
import { cn } from "../../lib/utils";
import "./glass-card.css";

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

/**
 * A frosted glass card for a login, onboarding or hero surface, with rounded
 * corners and responsive padding already set.
 *
 * Pass any Tailwind override through `className`; the merge is done with
 * `tailwind-merge`, so the last of two conflicting utilities wins (`p-4` over the
 * default `p-6 sm:p-8`). Inside a bento shell a frosted box is `BentoPanel`, and a
 * form section is `BentoFormSection`.
 *
 * The shadow tint follows `color` / `colorDark`. With neither, the light shadow
 * still takes `--ff-color-rgb` from an ancestor {@link FloatingFormulasBg}, so a
 * card inside one matches the surrounding palette without being told to.
 */
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
