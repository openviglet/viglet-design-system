import type { ReactNode } from "react";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { BentoTrail, type BentoTrailStep } from "./bento-trail";

/**
 * Canonical breadcrumb back-link for Bento heroes — a leading
 * `IconArrowLeft` followed by the label, pointing at the parent list/route.
 *
 * Centralised here so the arrow is part of the shared component instead of
 * being re-typed inline on every page (which is how the persona dashboard
 * ended up without it). Use it directly only when the eyebrow needs extra
 * trailing content (e.g. a status marker); otherwise pass
 * {@link BentoHeroProps.backTo} / {@link BentoHeroProps.backLabel} and let
 * {@link BentoHero} render it.
 */
export function BentoBackLink({ to, children }: Readonly<{ to: string; children: ReactNode }>) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 hover:text-foreground">
      <IconArrowLeft size={14} aria-hidden />
      {children}
    </Link>
  );
}

/**
 * The way back a hero draws above its title: a trail when there are ancestors to
 * name, the arrow back link when there is one parent, nothing when there is none.
 */
export function heroWayBack(
  trail: readonly BentoTrailStep[] | undefined,
  backTo?: string,
  backLabel?: ReactNode,
): ReactNode {
  if (trail && trail.length > 1) return <BentoTrail steps={trail} />;
  if (trail && trail.length === 1) return <BentoBackLink to={trail[0].to}>{trail[0].label}</BentoBackLink>;
  return backTo != null ? <BentoBackLink to={backTo}>{backLabel}</BentoBackLink> : null;
}

/**
 * VDS235 — which frame a page is drawn in. `showcase` is bento's: a large hero
 * and frosted panels, for a home or a dashboard. `work` is for the pages people
 * work in all day: a compact header and content flat on the page ground, so the
 * content is the largest thing on screen. A product chooses per route.
 */
export type BentoGrammar = "showcase" | "work";

export interface BentoHeroProps {
  /**
   * Small label above the headline. Typically the parent section
   * name (acts as a breadcrumb back-link). Accepts a `ReactNode` so
   * consumers can pass bespoke content.
   *
   * Prefer {@link BentoHeroProps.backTo} for the common "breadcrumb back to
   * the parent list" case — it renders the canonical leading `IconArrowLeft`
   * so no page can forget it. Pass `eyebrow` only for bespoke content (e.g. a
   * status marker appended after the link, composed with {@link BentoBackLink}).
   * If both are set, `eyebrow` wins.
   */
  eyebrow?: ReactNode;
  /**
   * Convenience for the canonical breadcrumb: renders the eyebrow as a
   * back-link (leading `IconArrowLeft` + {@link BentoHeroProps.backLabel})
   * pointing at this route. Ignored when `eyebrow` is provided.
   */
  backTo?: string;
  /** Label for the {@link BentoHeroProps.backTo} back-link. */
  backLabel?: ReactNode;
  /**
   * VDS184 — the entity's ancestors, root first and its parent last, for a
   * product whose content nests. Two or more render as linked steps where the
   * back link sits; one renders the arrow back link to it, as `backTo` would.
   * Wins over `backTo`; `eyebrow` still wins over both.
   */
  trail?: readonly BentoTrailStep[];
  /** Headline — a greeting, the page title, etc. */
  title: ReactNode;
  /** Sub-line below the title. */
  subtitle?: ReactNode;
  /** Visual badge / logo on the left of the headline. */
  leading?: ReactNode;
  /** Trailing slot — actions, chips, etc. Pushed to the far right. */
  trailing?: ReactNode;
  /**
   * `work` draws the compact header: the way back in small type above, the title
   * and the trailing actions on one line, a subtitle only if you pass one.
   */
  grammar?: BentoGrammar;
}

/**
 * Page-level hero block used at the top of every Bento page.
 *
 * Mirrors the "navigation title" pattern from iOS — large, airy,
 * left-aligned by default, and animates in with the same spring as
 * the rest of the bento shell. Stays outside the bento grid (no
 * card surface) so it reads as a section header rather
 * than as a tile.
 *
 * Layout contract: leading + title block always anchor to the start;
 * the optional `trailing` slot is pushed to the far right via
 * `ml-auto` so single-child (no trailing) renders deterministically
 * left-aligned without depending on `justify-content` quirks.
 */
export function BentoHero({
  eyebrow,
  backTo,
  backLabel,
  trail,
  title,
  subtitle,
  leading,
  trailing,
  grammar = "showcase",
}: Readonly<BentoHeroProps>) {
  // `eyebrow` wins for bespoke content; otherwise a trail or `backTo` renders
  // the canonical way back so no page has to re-type it.
  const eyebrowContent = eyebrow ?? heroWayBack(trail, backTo, backLabel);

  if (grammar === "work") {
    return (
      <header data-grammar="work" className="bento-shell-header mb-4 flex flex-col gap-1">
        {eyebrowContent && <span className="text-xs text-muted-foreground">{eyebrowContent}</span>}
        <div className="flex w-full min-w-0 items-center gap-3">
          {leading && <div className="shrink-0">{leading}</div>}
          <h1 className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight">{title}</h1>
          {trailing && <div className="ml-auto flex shrink-0 items-center gap-2">{trailing}</div>}
        </div>
        {subtitle && <p className="max-w-2xl truncate text-sm text-muted-foreground">{subtitle}</p>}
      </header>
    );
  }

  return (
    <header className="bento-shell-header mb-6 flex flex-col items-start gap-3 md:mb-10">
      <div className="flex w-full items-start gap-4">
        {leading && <div className="shrink-0">{leading}</div>}
        <div className="flex flex-1 flex-col gap-1">
          {eyebrowContent && (
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {eyebrowContent}
            </span>
          )}
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {trailing && <div className="ml-auto flex shrink-0 items-center gap-2">{trailing}</div>}
      </div>
    </header>
  );
}
