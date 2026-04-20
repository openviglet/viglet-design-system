import type { HTMLAttributes, CSSProperties } from "react";
import "./glass-card.css";

/**
 * GlassCard — glassmorphism container used by login and onboarding hero cards
 * across Viglet products.
 *
 * Delegates the outer shape (border radius, padding, spacing) to the caller so
 * it composes cleanly with any form/layout. Tint is driven by the same
 * `--ff-color-rgb` custom property used by {@link FloatingFormulasBg} so the
 * card shadow matches the surrounding background palette.
 */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color for the shadow tint (CSS `color` or `rgb(...)` value). */
  color?: string;
  /** Accent color in dark mode. */
  colorDark?: string;
}

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
      className={`vig-glass-card ${className ?? ""}`}
      style={{ ...(style ?? {}), ...themeStyle } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
