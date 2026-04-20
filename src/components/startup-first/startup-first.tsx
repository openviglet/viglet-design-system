import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";
import { FloatingFormulasBg, type FloatingFormulasBgProps } from "../ui/floating-formulas-bg";
import { GlassCard } from "../ui/glass-card";
import { PulseRing } from "../ui/pulse-ring";
import "./startup-first.css";

/**
 * StartupFirst — compound component for the product's first-access /
 * initial-setup screen (shown the first time an admin opens Turing, Dumont or
 * Shio, before any user has been configured).
 *
 * Mirrors the {@link Login} composition style so every product can reuse the
 * same palette, animated background and glass card. Content is fully slot-
 * based — consumers compose the steps/fields/actions they need.
 *
 * Example:
 *   <StartupFirst color="#2563eb" colorDark="#60a5fa">
 *     <StartupFirst.Background withOrbs withGrid />
 *     <StartupFirst.Content>
 *       <StartupFirst.Steps current={1} total={3} />
 *       <StartupFirst.Logo><TurLogo size={80} /></StartupFirst.Logo>
 *       <StartupFirst.Title>Welcome to Viglet Turing ES</StartupFirst.Title>
 *       <StartupFirst.Description>
 *         Let's create your first administrator account.
 *       </StartupFirst.Description>
 *       <StartupFirst.Card>
 *         <SetupForm />
 *       </StartupFirst.Card>
 *       <StartupFirst.Actions>
 *         <Button variant="outline">Back</Button>
 *         <Button>Continue</Button>
 *       </StartupFirst.Actions>
 *     </StartupFirst.Content>
 *   </StartupFirst>
 */

interface StartupFirstTheme {
  color?: string;
  colorDark?: string;
}
const StartupFirstThemeContext = createContext<StartupFirstTheme>({});

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

export interface StartupFirstRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color (hex). Cascades to every child effect. Default: Turing blue. */
  color?: string;
  /** Accent color in dark mode. Defaults to `color`. */
  colorDark?: string;
}

function StartupFirstRoot({
  color, colorDark, children, className, style, ...rest
}: Readonly<StartupFirstRootProps>) {
  const themeStyle: Record<string, string> = {};
  if (color) themeStyle["--ff-color"] = color;
  if (colorDark) themeStyle["--ff-color-dark"] = colorDark;
  else if (color) themeStyle["--ff-color-dark"] = color;
  const rgb = hexToRgbTriplet(color);
  if (rgb) themeStyle["--ff-color-rgb"] = rgb;
  const rgbDark = hexToRgbTriplet(colorDark) ?? rgb;
  if (rgbDark) themeStyle["--ff-color-dark-rgb"] = rgbDark;

  return (
    <StartupFirstThemeContext.Provider value={{ color, colorDark }}>
      <div
        className={`vig-sf relative min-h-svh flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 ${className ?? ""}`}
        style={{ ...(style ?? {}), ...themeStyle } as CSSProperties}
        {...rest}
      >
        {children}
      </div>
    </StartupFirstThemeContext.Provider>
  );
}

/** Animated backdrop (delegates to FloatingFormulasBg). */
function StartupFirstBackground(
  props: Readonly<Omit<FloatingFormulasBgProps, "color" | "colorDark">>,
) {
  const { color, colorDark } = useContext(StartupFirstThemeContext);
  return <FloatingFormulasBg color={color} colorDark={colorDark} {...props} />;
}

/** Centered stack that hosts every visible element. */
function StartupFirstContent({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`relative z-20 flex flex-col items-center w-full max-w-lg px-6 py-6 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

export interface StartupFirstStepsProps extends HTMLAttributes<HTMLDivElement> {
  /** 1-based index of the currently active step. */
  current: number;
  /** Total number of steps in the wizard. */
  total: number;
}
/** Step pagination dots shown at the top of the wizard. */
function StartupFirstSteps({ current, total, className, ...rest }: Readonly<StartupFirstStepsProps>) {
  return (
    <div
      className={`vig-sf__fade-in flex items-center gap-2 mb-4 ${className ?? ""}`}
      aria-label={`Step ${current} of ${total}`}
      {...rest}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={`step-${i + 1}`}
          className={i + 1 <= current ? "vig-sf__step vig-sf__step--active" : "vig-sf__step"}
          aria-current={i + 1 === current ? "step" : undefined}
        />
      ))}
    </div>
  );
}

interface StartupFirstLogoProps extends HTMLAttributes<HTMLDivElement> {
  pulsePaused?: boolean;
  /** Size in px of the outer logo chip. Defaults to 80. */
  size?: number;
}
/** Product logo wrapped in a pulse ring. */
function StartupFirstLogo({ children, pulsePaused, size = 80, className, style, ...rest }: Readonly<StartupFirstLogoProps>) {
  return (
    <div className={`vig-sf__fade-in mb-4 ${className ?? ""}`} style={style} {...rest}>
      <PulseRing paused={pulsePaused}>
        <div
          className="flex items-center justify-center rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-xl ring-1 ring-[rgba(var(--ff-color-rgb,37,99,235),0.2)] dark:ring-[rgba(var(--ff-color-dark-rgb,96,165,250),0.2)]"
          style={{ width: size, height: size }}
        >
          {children}
        </div>
      </PulseRing>
    </div>
  );
}

/** Product title in the wizard header. */
function StartupFirstTitle({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <div className="vig-sf__fade-in-d1 text-center mb-2">
      <h1
        className={`text-3xl font-bold tracking-tight bg-clip-text text-transparent vig-sf__title-gradient ${className ?? ""}`}
        {...rest}
      >
        {children}
      </h1>
    </div>
  );
}

/** Longer-form copy under the title (explanation, purpose of the step). */
function StartupFirstDescription({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <div className="vig-sf__fade-in-d1 text-center mb-5">
      <p className={`text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed ${className ?? ""}`} {...rest}>
        {children}
      </p>
    </div>
  );
}

/** Glass-morphism card that hosts the form / step content. */
function StartupFirstCard({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`vig-sf__fade-in-d2 w-full ${className ?? ""}`} {...rest}>
      <GlassCard className="rounded-2xl p-6">
        {children}
      </GlassCard>
    </div>
  );
}

/** Action row at the bottom (Back / Continue / etc). */
function StartupFirstActions({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`vig-sf__fade-in-d3 w-full mt-4 flex items-center justify-between gap-3 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

/** Subtle footer text (product line, version, support link). */
function StartupFirstFooter({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <div className="vig-sf__fade-in-d3 mt-6 text-center">
      <p className={`text-xs text-slate-400 dark:text-slate-500 ${className ?? ""}`} {...rest}>
        {children}
      </p>
    </div>
  );
}

export interface StartupFirstHintProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
}
/** Small tip callout used next to form fields. */
function StartupFirstHint({ icon, children, className, ...rest }: Readonly<StartupFirstHintProps>) {
  return (
    <div
      className={`vig-sf__hint flex items-start gap-2 rounded-lg px-3 py-2 text-xs text-slate-600 dark:text-slate-300 ${className ?? ""}`}
      {...rest}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

export const StartupFirst = Object.assign(StartupFirstRoot, {
  Background: StartupFirstBackground,
  Content: StartupFirstContent,
  Steps: StartupFirstSteps,
  Logo: StartupFirstLogo,
  Title: StartupFirstTitle,
  Description: StartupFirstDescription,
  Card: StartupFirstCard,
  Actions: StartupFirstActions,
  Footer: StartupFirstFooter,
  Hint: StartupFirstHint,
});
