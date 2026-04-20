import type { HTMLAttributes, CSSProperties } from "react";
import "./pulse-ring.css";

/**
 * PulseRing — animated ring that radiates outward from a logo container.
 *
 * Wraps a product logo (or any square-ish element) and emits a pulse in the
 * accent color to signal "the product is loading / ready". Used on login and
 * startup screens across Viglet products. Pass `color` / `colorDark` to match
 * the surrounding palette; by default matches Turing blue.
 *
 * The ring is rendered as a self-contained CSS animation on the element's
 * box-shadow — no extra DOM, no impact on layout beyond the wrapped logo.
 */
export interface PulseRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color of the pulse (light mode). */
  color?: string;
  /** Accent color in dark mode. */
  colorDark?: string;
  /** Disable the animation (useful when a settings switch turns it off). */
  paused?: boolean;
}

export function PulseRing({
  children,
  color,
  colorDark,
  paused,
  className,
  style,
  ...rest
}: Readonly<PulseRingProps>) {
  const themeStyle: CSSProperties & Record<string, string> = { ...(style ?? {}) };
  if (color) themeStyle["--pulse-ring-color"] = color;
  if (colorDark) themeStyle["--pulse-ring-color-dark"] = colorDark;
  else if (color) themeStyle["--pulse-ring-color-dark"] = color;

  return (
    <div
      className={`vig-pulse-ring ${paused ? "" : "vig-pulse-ring--active"} ${className ?? ""}`}
      style={themeStyle}
      {...rest}
    >
      {children}
    </div>
  );
}
