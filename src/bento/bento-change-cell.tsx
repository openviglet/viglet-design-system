import { IconRobot } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export interface BentoChangeCellProps {
  /** When the record last changed. */
  at: Date | number | string;
  /** Who changed it, already a display name. Omitted, the cell is the time alone. */
  actor?: string;
  /** Whether an agent made the change, which marks the actor line. */
  agent?: boolean;
  /** What "now" is, for a relative time measured from somewhere fixed. Defaults to when the cell mounted. */
  now?: Date | number;
  className?: string;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
/** Past this, a relative time ("5 weeks ago") is harder to place than a date. */
const MONTH = 30 * DAY;

/** The time from `now` to `date`, in the largest unit that keeps it a whole number above zero. */
function relative(date: Date, now: number, format: Intl.RelativeTimeFormat) {
  const delta = date.getTime() - now;
  const size = Math.abs(delta);
  if (size < MINUTE) return format.format(0, "second");
  if (size < HOUR) return format.format(Math.round(delta / MINUTE), "minute");
  if (size < DAY) return format.format(Math.round(delta / HOUR), "hour");
  return format.format(Math.round(delta / DAY), "day");
}

/**
 * VDS207 — the column that says when a record last changed, and who changed it.
 *
 * Each console drew `toLocaleDateString()`, which repeats one date down a list
 * and never says who. This draws a relative time in the reader's language ("2
 * days ago", then a short date past a month), with the exact instant as its
 * tooltip and as what a screen reader says, and an optional actor line marked
 * when the change came from an agent. It takes values and fetches nothing.
 */
export function BentoChangeCell({ at, actor, agent = false, now, className }: Readonly<BentoChangeCellProps>) {
  const { t, i18n } = useTranslation();
  const date = new Date(at);
  const valid = !Number.isNaN(date.getTime());
  // Read once, when the cell mounts: a render is not the place to read a clock.
  const [mounted] = useState(() => Date.now());
  const reference = now === undefined ? mounted : new Date(now).getTime();
  const language = i18n?.resolvedLanguage ?? i18n?.language;

  let shown = String(at);
  let exact = String(at);
  if (valid) {
    exact = new Intl.DateTimeFormat(language, { dateStyle: "long", timeStyle: "short" }).format(date);
    shown =
      Math.abs(date.getTime() - reference) < MONTH
        ? relative(date, reference, new Intl.RelativeTimeFormat(language, { numeric: "auto" }))
        : new Intl.DateTimeFormat(language, { dateStyle: "medium" }).format(date);
  }

  return (
    <span data-slot="bento-change-cell" className={cn("flex min-w-0 flex-col", className)}>
      <time dateTime={valid ? date.toISOString() : undefined} title={exact} className="truncate text-foreground">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{exact}</span>
      </time>
      {actor != null && (
        <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
          {agent && (
            <>
              <IconRobot size={12} aria-hidden="true" className="shrink-0" />
              <span className="sr-only">{t("bento.versions.agent", { defaultValue: "Agent" })}</span>
            </>
          )}
          <span className="truncate">{actor}</span>
        </span>
      )}
    </span>
  );
}
