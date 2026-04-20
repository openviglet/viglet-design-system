import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext } from "react";
import { FloatingFormulasBg, type FloatingFormulasBgProps } from "../ui/floating-formulas-bg";
import { GlassCard } from "../ui/glass-card";
import { PulseRing } from "../ui/pulse-ring";
import "./login.css";

/**
 * Login — compound component for the Viglet product login / hero screen.
 *
 * Use via the dot-notation children (`<Login.Background />`, `<Login.Logo>`,
 * `<Login.Title>`, etc.) to compose the screen. Every product sets its own
 * palette once at the root (`color` / `colorDark`) — it cascades to every
 * child that cares about accent color (bg, glass card shadow, pulse ring,
 * title gradient, feature pills).
 *
 * Example:
 *   <Login color="#2563eb" colorDark="#60a5fa">
 *     <Login.Background withLightning />
 *     <Login.Content>
 *       <Login.Logo><TurLogo size={52} /></Login.Logo>
 *       <Login.Title>Viglet Turing ES</Login.Title>
 *       <Login.Tagline>{t("login.heroTagline")}</Login.Tagline>
 *       <Login.Features>
 *         <Login.FeaturePill icon={<Search />}>Semantic search</Login.FeaturePill>
 *         <Login.FeaturePill icon={<Sparkles />}>AI</Login.FeaturePill>
 *       </Login.Features>
 *       <Login.Card><LoginForm /></Login.Card>
 *       <Login.Footer>Viglet Turing ES — Enterprise Search Intelligence</Login.Footer>
 *     </Login.Content>
 *   </Login>
 */

interface LoginTheme {
  color?: string;
  colorDark?: string;
}
const LoginThemeContext = createContext<LoginTheme>({});

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

export interface LoginRootProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent color (hex). Cascades to every child effect. Default: Turing blue. */
  color?: string;
  /** Accent color in dark mode. Defaults to `color`. */
  colorDark?: string;
}

function LoginRoot({
  color, colorDark, children, className, style, ...rest
}: Readonly<LoginRootProps>) {
  const themeStyle: Record<string, string> = {};
  if (color) themeStyle["--ff-color"] = color;
  if (colorDark) themeStyle["--ff-color-dark"] = colorDark;
  else if (color) themeStyle["--ff-color-dark"] = color;
  const rgb = hexToRgbTriplet(color);
  if (rgb) themeStyle["--ff-color-rgb"] = rgb;
  const rgbDark = hexToRgbTriplet(colorDark) ?? rgb;
  if (rgbDark) themeStyle["--ff-color-dark-rgb"] = rgbDark;

  return (
    <LoginThemeContext.Provider value={{ color, colorDark }}>
      <div
        className={`vig-login relative min-h-svh flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 ${className ?? ""}`}
        style={{ ...(style ?? {}), ...themeStyle } as CSSProperties}
        {...rest}
      >
        {children}
      </div>
    </LoginThemeContext.Provider>
  );
}

/** Animated backdrop. Accepts every `FloatingFormulasBgProps` toggle. */
function LoginBackground(props: Readonly<Omit<FloatingFormulasBgProps, "color" | "colorDark">>) {
  const { color, colorDark } = useContext(LoginThemeContext);
  return <FloatingFormulasBg color={color} colorDark={colorDark} {...props} />;
}

/** Absolute top-right toolbar slot (settings popover, theme toggle, etc.). */
function LoginSettings({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`absolute top-4 right-4 z-30 flex items-center gap-2 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

/** Centered stack container for the visible card + surrounding text. */
function LoginContent({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`relative z-20 flex flex-col items-center w-full max-w-md px-6 py-4 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

interface LoginLogoProps extends HTMLAttributes<HTMLDivElement> {
  /** Disable the pulse ring animation. */
  pulsePaused?: boolean;
}
/** Logo wrapper with pulse ring + glass container. */
function LoginLogo({ children, pulsePaused, className, ...rest }: Readonly<LoginLogoProps>) {
  return (
    <div className={`vig-login__fade-in mb-3 ${className ?? ""}`} {...rest}>
      <PulseRing paused={pulsePaused}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg ring-1 ring-[rgba(var(--ff-color-rgb,37,99,235),0.2)] dark:ring-[rgba(var(--ff-color-dark-rgb,96,165,250),0.2)]">
          {children}
        </div>
      </PulseRing>
    </div>
  );
}

/** Gradient product title. */
function LoginTitle({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLHeadingElement>>) {
  return (
    <div className="vig-login__fade-in-d1 text-center mb-1">
      <h1
        className={`text-2xl font-bold tracking-tight bg-clip-text text-transparent vig-login__title-gradient ${className ?? ""}`}
        {...rest}
      >
        {children}
      </h1>
    </div>
  );
}

/** Subtle tagline below the title. */
function LoginTagline({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <div className="vig-login__fade-in-d1 text-center mb-4">
      <p className={`text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed ${className ?? ""}`} {...rest}>
        {children}
      </p>
    </div>
  );
}

/** Row of feature pills. */
function LoginFeatures({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`vig-login__fade-in-d2 flex flex-wrap justify-center gap-2 mb-5 ${className ?? ""}`} {...rest}>
      {children}
    </div>
  );
}

export interface LoginFeaturePillProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
}
/** Single pill (icon + label) used inside {@link Login.Features}. */
function LoginFeaturePill({ icon, children, className, ...rest }: Readonly<LoginFeaturePillProps>) {
  return (
    <div className={`vig-login__feature-pill flex items-center gap-1.5 rounded-full px-3 py-1 ${className ?? ""}`} {...rest}>
      {icon}
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{children}</span>
    </div>
  );
}

/** Glass-morphism card that hosts the actual login form. */
function LoginCard({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div className={`vig-login__fade-in-d3 w-full ${className ?? ""}`} {...rest}>
      <GlassCard>{children}</GlassCard>
    </div>
  );
}

/** Subtle footer line below the form. */
function LoginFooter({ children, className, ...rest }: Readonly<HTMLAttributes<HTMLParagraphElement>>) {
  return (
    <div className="vig-login__fade-in-d3 mt-4 text-center">
      <p className={`text-xs text-slate-400 dark:text-slate-500 ${className ?? ""}`} {...rest}>
        {children}
      </p>
    </div>
  );
}

export const Login = Object.assign(LoginRoot, {
  Background: LoginBackground,
  Settings: LoginSettings,
  Content: LoginContent,
  Logo: LoginLogo,
  Title: LoginTitle,
  Tagline: LoginTagline,
  Features: LoginFeatures,
  FeaturePill: LoginFeaturePill,
  Card: LoginCard,
  Footer: LoginFooter,
});
