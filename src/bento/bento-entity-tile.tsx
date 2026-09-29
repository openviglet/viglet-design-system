import { Icon } from "@iconify/react";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { BENTO_EMPHASIS_SPAN, type BentoEmphasis } from "./bento-layout";
import { BentoStatusMarker, type BentoRecordState } from "./bento-status-marker";
import type { BentoTone } from "./bento-tones";

export interface BentoEntityTileProps {
  /** Link target for the tile. */
  to: string;
  /**
   * Tile prominence. `LARGE` = 2×2 hero, `MEDIUM` = 2×1 wide (default),
   * `SMALL` = compact 1×1. Takes precedence over the legacy `featured` flag.
   */
  emphasis?: BentoEmphasis;
  /**
   * Legacy prominence flag (still used by the home + area mosaics): `true` maps
   * to `LARGE`, `false` to `MEDIUM`. Ignored when `emphasis` is set.
   */
  featured?: boolean;
  /** Default Tabler icon when no Iconify `icon` is set. */
  defaultIcon: TablerIcon;
  /** User-picked Iconify icon name, if any. */
  icon?: string | null;
  /** @deprecated Ignored since VDS182: a list tile carries no tone of its own; pass `state`. */
  tone?: BentoTone;
  /** The record's state, drawn as a dot and a word — the one colour a list tile carries. */
  state?: BentoRecordState;
  title: string;
  description?: string | null;
  /** Optional meta chips/text under the title (e.g. vendor, model name). */
  meta?: ReactNode;
  /** Render the Active/Idle status pill (driven by `enabled`). */
  enabled?: number;
  hasStatus?: boolean;
  /** iOS shared-element transition name (matches the detail page). */
  viewTransitionName?: string;
}

/**
 * The common Bento content tile: icon in a neutral well + optional status pill
 * or record state + title + description + optional meta row, sized by {@link BentoEmphasis}.
 * Covers the shape shared by the entity lists; entities with a bespoke tile can
 * skip it and pass their own node to {@link BentoListPage}'s `renderTile`.
 */
export function BentoEntityTile({
  to,
  emphasis,
  featured,
  defaultIcon: DefaultIcon,
  icon,
  title,
  description,
  meta,
  state,
  enabled,
  hasStatus = false,
  viewTransitionName,
}: Readonly<BentoEntityTileProps>) {
  const { t } = useTranslation();
  const resolvedEmphasis: BentoEmphasis = emphasis ?? (featured ? "LARGE" : "MEDIUM");
  const isLarge = resolvedEmphasis === "LARGE";
  const isSmall = resolvedEmphasis === "SMALL";
  const span = BENTO_EMPHASIS_SPAN[resolvedEmphasis];
  const isEnabled = enabled === 1;
  const padding = isLarge ? "p-6 md:p-7" : isSmall ? "p-4" : "p-5";
  const iconChip = isLarge ? "h-14 w-14" : isSmall ? "h-8 w-8" : "h-9 w-9";
  const iconSize = isLarge ? 28 : isSmall ? 16 : 18;
  const titleSize = isLarge ? "text-xl md:text-2xl" : isSmall ? "text-sm" : "text-base md:text-lg";

  return (
    <Link
      to={to}
      className={`bento-tile bento-tile-clickable bento-glass group relative flex flex-col ${isLarge ? "gap-5" : "gap-4"} overflow-hidden ${padding} ${span}`}
      style={viewTransitionName ? ({ viewTransitionName } as React.CSSProperties) : undefined}
    >
      <div className="relative z-1 flex items-center justify-between">
        <span className={`bento-well grid place-items-center rounded-2xl ${iconChip}`}>
          {icon
            ? <Icon icon={icon} className={isLarge ? "size-7" : "size-4.5"} />
            : <DefaultIcon size={iconSize} />}
        </span>
        {hasStatus && (
          <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
            isEnabled
              ? "bento-status bento-status-on"
              : "border-border bg-muted text-muted-foreground"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isEnabled ? "bento-status-dot bento-pulse" : "bg-muted-foreground/60"}`} />
            {isEnabled ? t("common.active", { defaultValue: "Active" }) : t("common.idle", { defaultValue: "Idle" })}
          </span>
        )}
      </div>
      <div className="relative z-1">
        <div className={`font-semibold tracking-tight ${titleSize}`}>{title}</div>
        {!isSmall && meta && <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{meta}</div>}
        {!isSmall && description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {state && <BentoStatusMarker state={state} className="mt-3" />}
      </div>
    </Link>
  );
}
