import { useMemo, type CSSProperties } from "react";
import "./floating-formulas-bg.css";

/**
 * FloatingFormulasBg — rich animated background shared by every Viglet product
 * (Turing ES, Dumont, Shio, Viglet Cloud, viglet.org).
 *
 * Bundles every effect the login/hero pattern uses as togglable layers:
 *
 *   • formulas       — floating chemistry tokens + optional product words
 *   • bonds          — molecular bond SVGs
 *   • orbs           — three blurred gradient "clouds" for ambient glow
 *   • lightning      — cluster of radial-gradient flashes
 *   • explosion      — rare full-screen nuke + flood pulse (needs lightning)
 *   • grid           — subtle dot grid
 *
 * Every effect is color-driven by two CSS custom properties set on the root
 * element: `--ff-color` (light) / `--ff-color-dark` (dark). Callers that want
 * to follow Turing blue don't pass anything; any product that wants its own
 * palette passes `color` / `colorDark`.
 */

const FORMULAS = [
  "H\u2082O", "CO\u2082", "NaCl", "C\u2086H\u2081\u2082O\u2086", "O\u2082",
  "NH\u2083", "CH\u2084", "H\u2082SO\u2084", "Fe\u2082O\u2083", "CaCO\u2083",
  "C\u2082H\u2085OH", "HCl", "NaOH", "KMnO\u2084", "N\u2082",
  "SiO\u2082", "Al\u2082O\u2083", "MgO", "ZnSO\u2084", "Cu",
  "H\u2082O\u2082", "SO\u2083", "PbO\u2082", "BaSO\u2084", "AgNO\u2083",
  "K\u2082Cr\u2082O\u2087", "Na\u2082CO\u2083", "Mg(OH)\u2082", "FeCl\u2083", "CuSO\u2084",
  "Ca(OH)\u2082", "HNO\u2083", "P\u2084O\u2081\u2080", "Cl\u2082", "Br\u2082",
];

const DRIFT_CLASSES = [
  "ff-drift-a", "ff-drift-b", "ff-drift-c", "ff-drift-d", "ff-drift-e",
];

interface Bond {
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  drift: string;
  opacity: number;
  path: string;
}

const BONDS: Bond[] = [
  { top: "8%",  left: "6%",  size: 80, duration: 18, delay: -2, drift: "ff-drift-b", opacity: 0.3,
    path: "M10,40 L40,20 L70,40 M40,20 L40,5 M40,20 L25,8 M40,20 L55,8" },
  { top: "22%", left: "75%", size: 100, duration: 22, delay: -5, drift: "ff-drift-a", opacity: 0.25,
    path: "M20,50 L50,30 L80,50 M50,30 L50,10 M20,50 L20,70 M80,50 L80,70 M50,30 L35,15 M50,30 L65,15" },
  { top: "60%", left: "85%", size: 70, duration: 16, delay: -1, drift: "ff-drift-b", opacity: 0.28,
    path: "M15,35 L35,15 L55,35 L35,55 Z M35,15 L35,5 M55,35 L65,35" },
  { top: "70%", left: "12%", size: 90, duration: 20, delay: -4, drift: "ff-drift-a", opacity: 0.25,
    path: "M10,45 L45,25 L80,45 M45,25 L45,5 M10,45 L10,65 M80,45 L80,65" },
  { top: "5%",  left: "42%", size: 60, duration: 15, delay: -3, drift: "ff-drift-c", opacity: 0.22,
    path: "M10,30 L30,10 L50,30 M30,10 L30,0 M10,30 L0,40 M50,30 L60,40" },
  { top: "45%", left: "3%",  size: 75, duration: 19, delay: -6, drift: "ff-drift-a", opacity: 0.25,
    path: "M20,40 L40,20 L60,40 M40,20 L40,5 M20,40 L5,50 M60,40 L75,50 M40,5 L30,0 M40,5 L50,0" },
  { top: "78%", left: "52%", size: 85, duration: 21, delay: -2, drift: "ff-drift-b", opacity: 0.22,
    path: "M15,45 L42,20 L70,45 M42,20 L42,5 M15,45 L30,60 M70,45 L55,60" },
  { top: "32%", left: "92%", size: 65, duration: 17, delay: -5, drift: "ff-drift-a", opacity: 0.25,
    path: "M10,35 L32,15 L55,35 M32,15 L32,3 M10,35 L10,50" },
  { top: "15%", left: "28%", size: 70, duration: 19, delay: -1, drift: "ff-drift-c", opacity: 0.25,
    path: "M10,35 L35,10 L60,35 M35,10 L35,0 M10,35 L0,50 M60,35 L70,50" },
  { top: "50%", left: "35%", size: 65, duration: 16, delay: -7, drift: "ff-drift-b", opacity: 0.2,
    path: "M10,30 L30,10 L50,30 L30,50 Z M30,10 L30,0" },
  { top: "40%", left: "60%", size: 80, duration: 20, delay: -3, drift: "ff-drift-a", opacity: 0.22,
    path: "M15,40 L40,15 L65,40 M40,15 L40,3 M15,40 L5,55 M65,40 L75,55 M40,15 L28,5 M40,15 L52,5" },
  { top: "85%", left: "78%", size: 60, duration: 15, delay: -6, drift: "ff-drift-b", opacity: 0.22,
    path: "M10,30 L30,10 L50,30 M30,10 L30,0 M10,30 L0,40 M50,30 L60,40" },
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function tokenizeNames(names: string[]): string[] {
  const tokens = new Set<string>();
  for (const name of names) {
    for (const token of name.split(/[\s_-]+/)) {
      const trimmed = token.trim();
      if (trimmed.length > 0) tokens.add(trimmed);
    }
  }
  return Array.from(tokens);
}

/**
 * Parse a `#rgb`/`#rrggbb` hex color into its CSS `rgb(...)`-compatible
 * "R, G, B" triplet. Returns `null` if the input isn't a recognizable hex —
 * callers fall back to the Turing default.
 */
function hexToRgbTriplet(hex?: string): string | null {
  if (!hex) return null;
  const m3 = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex.trim());
  if (m3) {
    const [, r, g, b] = m3;
    return `${Number.parseInt(r + r, 16)}, ${Number.parseInt(g + g, 16)}, ${Number.parseInt(b + b, 16)}`;
  }
  const m6 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (m6) {
    const [, r, g, b] = m6;
    return `${Number.parseInt(r, 16)}, ${Number.parseInt(g, 16)}, ${Number.parseInt(b, 16)}`;
  }
  return null;
}

function buildFloatingItems(texts: string[], count: number) {
  const rand = seededRandom(Date.now() % 100000);
  const picked = [...texts].sort(() => rand() - 0.5).slice(0, count);
  return picked.map((text) => ({
    text,
    top: `${rand() * 85 + 2}%`,
    left: `${rand() * 88 + 2}%`,
    size: 0.8 + rand() * 1.2,
    duration: 10 + rand() * 20,
    delay: -(rand() * 20),
    drift: DRIFT_CLASSES[Math.floor(rand() * DRIFT_CLASSES.length)],
    opacity: 0.2 + rand() * 0.35,
  }));
}

export interface FloatingFormulasBgProps {
  /** How many floating formulas to render. Defaults to 35 (rich login style). */
  itemCount?: number;
  /**
   * Optional product-specific strings (site names, connector names, etc.) to
   * mix into the formula pool. Tokenized on whitespace/`-`/`_`.
   */
  extraTokens?: string[];
  /** Accent color for formulas / bonds / orbs / lightning. Defaults to Turing blue. */
  color?: string;
  /** Accent color in dark mode. Defaults to Turing dark blue. */
  colorDark?: string;
  /** Render floating formula terms. Defaults to true. */
  withFormulas?: boolean;
  /** Render molecular bond SVGs. Defaults to true. */
  withBonds?: boolean;
  /** Render three ambient glow "orbs" (blurred gradient clouds). Defaults to true. */
  withOrbs?: boolean;
  /** Render lightning flash cluster. Defaults to false. */
  withLightning?: boolean;
  /** Render the rare full-screen nuke+flood pulse (requires lightning). Defaults to false. */
  withExplosion?: boolean;
  /** Render the subtle dot grid. Defaults to true. */
  withGrid?: boolean;
  /** Additional CSS classes applied to the root container. */
  className?: string;
}

export function FloatingFormulasBg({
  itemCount = 35,
  extraTokens,
  color,
  colorDark,
  withFormulas = true,
  withBonds = true,
  withOrbs = true,
  withLightning = false,
  withExplosion = false,
  withGrid = true,
  className,
}: Readonly<FloatingFormulasBgProps>) {
  const items = useMemo(
    () => buildFloatingItems(
      [...FORMULAS, ...(extraTokens ? tokenizeNames(extraTokens) : [])],
      itemCount,
    ),
    [itemCount, extraTokens],
  );

  const themeStyle: Record<string, string> = {};
  if (color) themeStyle["--ff-color"] = color;
  if (colorDark) themeStyle["--ff-color-dark"] = colorDark;
  else if (color) themeStyle["--ff-color-dark"] = color;
  const rgb = hexToRgbTriplet(color);
  if (rgb) themeStyle["--ff-color-rgb"] = rgb;
  const rgbDark = hexToRgbTriplet(colorDark) ?? rgb;
  if (rgbDark) themeStyle["--ff-color-dark-rgb"] = rgbDark;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className ?? ""}`}
      style={themeStyle as CSSProperties}
      aria-hidden="true"
    >
      {withLightning && (
        <>
          <div className="ff-lightning ff-lightning--a1" />
          <div className="ff-lightning ff-lightning--a2" />
          <div className="ff-lightning ff-lightning--a3" />
          <div className="ff-lightning ff-lightning--b1" />
          <div className="ff-lightning ff-lightning--b2" />
          <div className="ff-lightning ff-lightning--c1" />
          <div className="ff-lightning ff-lightning--c2" />
          <div className="ff-lightning ff-lightning--c3" />
          {withExplosion && (
            <>
              <div className="ff-lightning ff-lightning--nuke" />
              <div className="ff-lightning--flood" />
            </>
          )}
        </>
      )}

      {withOrbs && (
        <>
          <div className="ff-orb ff-orb--1" />
          <div className="ff-orb ff-orb--2" />
          <div className="ff-orb ff-orb--3" />
        </>
      )}

      {withGrid && <div className="ff-grid" />}

      {withBonds && BONDS.map((b) => (
        <svg
          key={`bond-${b.top}-${b.left}`}
          className={`ff-bond ${b.drift}`}
          width={b.size}
          height={b.size}
          viewBox={`0 0 ${b.size} ${b.size}`}
          style={{
            top: b.top, left: b.left,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            opacity: b.opacity,
          }}
        >
          <path
            d={b.path} fill="none"
            className="ff-bond-line"
            strokeWidth="1.5" strokeLinecap="round"
          />
          {Array.from(b.path.matchAll(/[ML]\s*(\d+),(\d+)/g)).map((m) => (
            <circle
              key={`node-${m[1]}-${m[2]}`}
              cx={m[1]} cy={m[2]}
              r="2.5" className="ff-bond-node"
            />
          ))}
        </svg>
      ))}

      {withFormulas && items.map((item) => (
        <span
          key={`f-${item.text}-${item.top}-${item.left}`}
          className={`ff-term ${item.drift}`}
          style={{
            top: item.top, left: item.left,
            fontSize: `${item.size}rem`,
            animationDuration: `${item.duration}s`,
            animationDelay: `${item.delay}s`,
            opacity: item.opacity,
          }}
        >
          {item.text}
        </span>
      ))}
    </div>
  );
}
