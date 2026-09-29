import type { Icon as TablerIcon } from "@tabler/icons-react";
import { IconSparkles } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { BentoTone } from "./bento-tones";

export interface BentoEmptyStateProps {
  /** Icon in the leading neutral well. Defaults to a sparkle. */
  icon?: TablerIcon;
  /** @deprecated Ignored since VDS182: an empty state names nothing, so its icon sits in a neutral well. */
  tone?: BentoTone;
  /** Headline — what's missing, in plain language. */
  title: string;
  /** One-line hint on how to fill it. */
  description?: ReactNode;
  /** Optional call-to-action (a `BentoEntityTile`-style link, a button, …). */
  action?: ReactNode;
  /**
   * Content alignment. `center` (default) suits standalone panels — a chart
   * with no data, an analytics tab before the first run. `start` suits an
   * empty cell inside a mosaic (see the list-page `EmptyHintTile`).
   */
  align?: "center" | "start";
  /**
   * The title's heading level, one below the heading the empty state sits under:
   * 2 under a page's hero, 3 inside a section. It is a heading in every chrome,
   * since a styled div in one and a heading in another is a skipped level inside
   * a shared component.
   */
  titleLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * The one canonical Bento empty-state (T572). Every "nothing here yet" surface
 * — an empty entity list, a chart with no samples, an analytics tab before its
 * first data point — renders this so the void reads the same everywhere: a
 * `bento-glass` card, an icon in a neutral well, a short title, a one-line
 * hint, and an optional CTA. Consistency here is the delight: an empty screen
 * that looks designed rather than broken.
 *
 * The list mosaic's `EmptyHintTile` delegates to this component (wrapping it in
 * the grid span), so lists and standalone panels stay visually identical.
 */
export function BentoEmptyState({
  icon: Icon = IconSparkles,
  title,
  description,
  action,
  align = "center",
  titleLevel = 2,
  className,
}: Readonly<BentoEmptyStateProps>) {
  const centered = align === "center";
  const Title = `h${titleLevel}` as const;
  return (
    <div
      className={cn(
        "bento-tile bento-glass flex flex-col gap-3 rounded-3xl p-8",
        centered ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <span
        className="bento-well grid h-12 w-12 place-items-center rounded-2xl"
      >
        <Icon size={24} />
      </span>
      <Title className="m-0 text-lg font-semibold tracking-tight">{title}</Title>
      {description && (
        <p className={cn("max-w-md text-sm text-muted-foreground", centered && "mx-auto")}>
          {description}
        </p>
      )}
      {action && <div className={cn("mt-1", centered && "mx-auto")}>{action}</div>}
    </div>
  );
}
