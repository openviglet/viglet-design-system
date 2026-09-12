import type { HTMLAttributes, CSSProperties } from "react";

import { cn } from "@/lib/utils";

import "./pulse-ring.css";

export interface PulseRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color of the pulse (light mode). */
  color?: string;
  /** Accent color in dark mode. */
  colorDark?: string;
  /** Disable the animation (useful when a settings switch turns it off). */
  paused?: boolean;
}

/**
 * An animated ring radiating from a logo, to say a product is loading or ready on
 * a login or first-access screen.
 *
 * It wraps the logo, or any square-ish element, and pulses in the accent colour.
 * Pass `color` / `colorDark` to match the surrounding palette. The ring is a CSS
 * animation on the element's box-shadow: no extra DOM, and no effect on layout
 * beyond the wrapped logo. `Login.Logo` and `StartupFirst.Logo` already wrap one.
 */
export function PulseRing({
  children,
  color,
  colorDark,
  paused,
  className,
  style,
  ...rest
}: Readonly<PulseRingProps>) {
  const themeStyle: Record<string, string> = {};
  if (color) themeStyle["--pulse-ring-color"] = color;
  if (colorDark) themeStyle["--pulse-ring-color-dark"] = colorDark;
  else if (color) themeStyle["--pulse-ring-color-dark"] = color;

  return (
    <div
      className={cn("vig-pulse-ring", !paused && "vig-pulse-ring--active", className)}
      style={{ ...(style ?? {}), ...themeStyle } as CSSProperties}
      {...rest}
    >
      {children}
    </div>
  );
}
