import { Icon } from "@iconify/react";
import type { Icon as TablerIcon } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { BENTO_EMPHASIS_SPAN, type BentoEmphasis } from "./bento-layout";
import { bentoChipClass, type BentoTone } from "./bento-tones";

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
  tone?: BentoTone;
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
 * The common Bento content tile: tonal icon chip + optional status pill +
 * title + description + optional meta row, sized by {@link BentoEmphasis}.
 * Covers the shape shared by the entity lists; entities with a bespoke tile can
 * skip it and pass their own node to {@link BentoListPage}'s `renderTile`.
 */
export function BentoEntityTile({
  to,
  emphasis,
  featured,
  defaultIcon: DefaultIcon,
  icon,
  tone = "indigo",
  title,
  description,
  meta,
  enabled,
  hasStatus = false,
  viewTransitionName,
}: Readonly<BentoEntityTileProps>) {
  const { t } = useTranslation();
  const chip = bentoChipClass(tone);
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
      {isLarge && (
        <>
          <div aria-hidden className={`pointer-events-none absolute -bottom-10 -right-10 h-64 w-64 rounded-full ${chip} opacity-40 blur-2xl dark:opacity-50`} />
          <div aria-hidden className={`pointer-events-none absolute right-12 top-1/3 h-32 w-32 rounded-full ${chip} bento-chip-tr opacity-20 blur-2xl dark:opacity-30`} />
        </>
      )}

      <div className="relative z-1 flex items-center justify-between">
        <span className={`grid place-items-center rounded-2xl ${chip} text-white shadow-md ${iconChip}`}>
          {icon
            ? <Icon icon={icon} className={isLarge ? "size-7 text-white" : "size-4.5 text-white"} />
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
      </div>
    </Link>
  );
}
