import { IconAlertTriangle } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/**
 * The five states a record can be in, and the only tones a row or a list tile
 * carries (VDS182). A product area has no tone of its own.
 */
export type BentoRecordState = "published" | "draft" | "scheduled" | "changed" | "archived";

/** Every record state, in the order a reader meets them. */
export const BENTO_RECORD_STATES: readonly BentoRecordState[] = [
  "published",
  "draft",
  "scheduled",
  "changed",
  "archived",
];

export interface BentoStatusMarkerProps {
  /**
   * The title is empty / missing. Takes precedence over `dirty` and renders
   * a red blocking marker — the same condition that disables the Save button.
   */
  titleMissing?: boolean;
  /** There are unsaved changes — renders an amber "unsaved" cue. */
  dirty?: boolean;
  /**
   * The record's state, drawn as a dot and a word. The two save cues above win
   * over it, because while a form cannot be saved that is what the reader needs.
   */
  state?: BentoRecordState;
  className?: string;
}

/**
 * A small mark in a bento hero's eyebrow, a row or a tile, saying what state a
 * record is in, or that a form cannot be saved yet or has unsaved changes.
 *
 * It carries the two save-state cues the bento detail pages kept from the console's
 * sticky header:
 *
 *   - `titleMissing` → a red "Title required" blocker (Save is also disabled).
 *   - `dirty`        → an amber "Unsaved changes" cue with a pulsing dot.
 *
 * and, since VDS182, the record's `state` as a dot and a word: published,
 * draft, scheduled, changed since publish, archived. That is where colour goes
 * on a list; a product area gets none.
 *
 * Renders nothing when none applies. Case/tracking are reset so it can sit
 * inside the hero eyebrow (which is uppercase + wide-tracked) without
 * inheriting those styles.
 *
 * @author Alexandre Oliveira
 * @since 2026.3.4
 */
export function BentoStatusMarker({ titleMissing, dirty, state, className }: Readonly<BentoStatusMarkerProps>) {
  const { t } = useTranslation();

  if (!titleMissing && !dirty && !state) return null;

  const base =
    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium normal-case leading-none tracking-normal";

  if (titleMissing) {
    return (
      <span
        className={cn(base, "bento-status bento-status-error", className)}
      >
        <IconAlertTriangle className="size-3" />
        {t("bento.saveBar.titleRequired", { defaultValue: "Title required" })}
      </span>
    );
  }

  if (dirty) {
    return (
      <span
        className={cn(base, "bento-status bento-status-warn", className)}
      >
        <span className="h-1.5 w-1.5 rounded-full bento-status-dot bento-pulse" />
        {t("bento.saveBar.unsaved", { defaultValue: "Unsaved changes" })}
      </span>
    );
  }

  return (
    <span
      data-state={state}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-normal normal-case leading-none tracking-normal",
        state === "archived" ? "text-muted-foreground" : "text-foreground/80",
        `bento-state-${state}`,
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bento-state-dot" />
      {t(`bento.state.${state}`)}
    </span>
  );
}
