import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { type DragEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export interface BentoCalendarEntry {
  id: string;
  /** When it happens: an instant, drawn on the day it falls on in `timeZone`. */
  start: Date | number | string;
  /** What it is, already translated. Also what a move is announced by. */
  label: string;
  /** Tinted as a status is elsewhere in the bento layer. Omitted, it is neutral. */
  tone?: "on" | "warn" | "error";
}

export type BentoCalendarView = "month" | "week";

export interface BentoCalendarProps {
  entries: readonly BentoCalendarEntry[];
  /** Controlled view. Omitted, the calendar owns it. */
  view?: BentoCalendarView;
  defaultView?: BentoCalendarView;
  onViewChange?: (view: BentoCalendarView) => void;
  /** A day in the period shown first. Defaults to today. */
  defaultDate?: Date | number | string;
  /** The zone the grid is drawn in, as an IANA name. Defaults to the reader's. */
  timeZone?: string;
  /** 0 is Sunday, 1 Monday. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * Given, entries can be dragged, or picked up from the keyboard, onto another
   * day. Called with the new start: the same time of day, on the day dropped on.
   */
  onEntryMove?: (id: string, start: Date) => void;
  /** Given, activating an entry calls this, so the product can open it. */
  onEntrySelect?: (id: string) => void;
  /** Called with the instants the shown period spans, end exclusive, so a product can load its entries. */
  onRangeChange?: (range: { start: Date; end: Date }) => void;
  /** The grid's accessible name. Defaults to the period's title. */
  label?: string;
  className?: string;
}

/** A day on the wall calendar, independent of any zone. */
type Civil = { y: number; m: number; d: number };

const civilKey = ({ y, m, d }: Civil) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const civilUtc = ({ y, m, d }: Civil) => Date.UTC(y, m - 1, d);
const fromUtc = (ms: number): Civil => {
  const date = new Date(ms);
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() };
};
const addDays = (day: Civil, n: number) => fromUtc(civilUtc(day) + n * 86_400_000);
const addMonths = (day: Civil, n: number): Civil => {
  const first = new Date(Date.UTC(day.y, day.m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return { y: first.getUTCFullYear(), m: first.getUTCMonth() + 1, d: Math.min(day.d, last) };
};
const weekday = (day: Civil) => new Date(civilUtc(day)).getUTCDay();

/** An instant's wall-clock reading in a zone. */
function wallClock(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour"), mi: get("minute"), s: get("second") };
}

/** The instant a wall-clock reading in a zone names, found by correcting for the zone's offset twice, across a change of offset. */
function instantOf(day: Civil, h: number, mi: number, s: number, ms: number, timeZone: string) {
  const wall = Date.UTC(day.y, day.m - 1, day.d, h, mi, s);
  const offset = (at: number) => {
    const c = wallClock(at, timeZone);
    return Date.UTC(c.y, c.m - 1, c.d, c.h, c.mi, c.s) - Math.floor(at / 1000) * 1000;
  };
  let at = wall - offset(wall);
  const second = offset(at);
  if (wall - second !== at) at = wall - second;
  return new Date(at + ms);
}

const TONE: Record<NonNullable<BentoCalendarEntry["tone"]>, string> = {
  on: "bento-status bento-status-on",
  warn: "bento-status bento-status-warn",
  error: "bento-status bento-status-error",
};

/**
 * VDS172 — a month or week of caller-supplied entries, for a page of what is
 * scheduled: publications, reviews, releases.
 *
 * Entries come in and moves go out; the product owns the data and the write. A
 * day is a grid cell the arrow keys move between, PageUp and PageDown turn the
 * period, and the grid is drawn in `timeZone` since the page states the reader's
 * zone. With `onEntryMove` an entry drags onto another day and keeps its time of
 * day, and the same move has a keyboard path, so dragging is never the only way:
 * Enter reaches a day's entries, Space picks one up, the arrows choose a day and
 * Enter drops it, announced as it happens. It fetches nothing.
 */
export function BentoCalendar({
  entries,
  view,
  defaultView = "month",
  onViewChange,
  defaultDate,
  timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  weekStartsOn = 0,
  onEntryMove,
  onEntrySelect,
  onRangeChange,
  label,
  className,
}: Readonly<BentoCalendarProps>) {
  const { t, i18n } = useTranslation();
  // The language the product set, even where it ships no catalogue for it.
  const locale = i18n?.resolvedLanguage ?? i18n?.language;
  const dayOf = (at: Date | number | string) => {
    const c = wallClock(new Date(at).getTime(), timeZone);
    return { y: c.y, m: c.m, d: c.d };
  };

  const [ownView, setOwnView] = useState<BentoCalendarView>(defaultView);
  const shown = view ?? ownView;
  const [focused, setFocused] = useState<Civil>(() => dayOf(defaultDate ?? Date.now()));
  const [carrying, setCarrying] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const cells = useRef(new Map<string, HTMLTableCellElement>());
  const wantFocus = useRef(false);
  const hintId = useId();

  // Read once, as the first focused day is: a render reads no clock.
  const [today] = useState(() => civilKey(dayOf(Date.now())));

  // The shown period follows the focused day: its month, or its week.
  const weekStart = (day: Civil) => addDays(day, -((weekday(day) - weekStartsOn + 7) % 7));
  const first = shown === "month" ? weekStart({ ...focused, d: 1 }) : weekStart(focused);
  const weekCount =
    shown === "month"
      ? Math.ceil((civilUtc(addMonths({ ...focused, d: 1 }, 1)) - civilUtc(first)) / (7 * 86_400_000))
      : 1;
  const weeks = Array.from({ length: weekCount }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(first, w * 7 + i)));
  const last = addDays(first, weekCount * 7);

  const rangeKey = `${civilKey(first)}/${civilKey(last)}`;
  useEffect(() => {
    onRangeChange?.({ start: instantOf(first, 0, 0, 0, 0, timeZone), end: instantOf(last, 0, 0, 0, 0, timeZone) });
    // Called once per period, not on every render that rebuilt the same one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey, timeZone]);

  useEffect(() => {
    if (!wantFocus.current) return;
    wantFocus.current = false;
    cells.current.get(civilKey(focused))?.focus();
  });

  const byDay = new Map<string, { entry: BentoCalendarEntry; time: number }[]>();
  for (const entry of entries) {
    const at = new Date(entry.start).getTime();
    if (Number.isNaN(at)) continue;
    const key = civilKey(dayOf(at));
    const list = byDay.get(key) ?? [];
    list.push({ entry, time: at });
    byDay.set(key, list);
  }
  for (const list of byDay.values()) list.sort((a, b) => a.time - b.time);

  const utcFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
  const fullDay = (day: Civil) => utcFormat({ dateStyle: "full" }).format(civilUtc(day));
  const timeOf = (at: number) => new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone }).format(at);
  const title =
    shown === "month"
      ? utcFormat({ month: "long", year: "numeric" }).format(civilUtc({ ...focused, d: 1 }))
      : `${utcFormat({ dateStyle: "medium" }).format(civilUtc(first))} – ${utcFormat({ dateStyle: "medium" }).format(civilUtc(addDays(last, -1)))}`;

  function focusDay(day: Civil) {
    wantFocus.current = true;
    setFocused(day);
  }

  function changeView(next: BentoCalendarView) {
    if (view === undefined) setOwnView(next);
    onViewChange?.(next);
  }

  const turn = (n: number) => (shown === "month" ? addMonths(focused, n) : addDays(focused, 7 * n));

  function move(id: string, day: Civil) {
    const entry = entries.find((e) => e.id === id);
    if (!entry || !onEntryMove) return;
    const at = new Date(entry.start).getTime();
    const c = wallClock(at, timeZone);
    if (civilKey(c) !== civilKey(day)) onEntryMove(id, instantOf(day, c.h, c.mi, c.s, at % 1000, timeZone));
    setSaid(t("bento.calendar.moved", { defaultValue: "Moved {{label}} to {{day}}.", label: entry.label, day: fullDay(day) }));
  }

  function onCellKeyDown(event: KeyboardEvent<HTMLTableCellElement>, day: Civil) {
    const target = {
      ArrowLeft: () => addDays(day, -1),
      ArrowRight: () => addDays(day, 1),
      ArrowUp: () => addDays(day, -7),
      ArrowDown: () => addDays(day, 7),
      Home: () => weekStart(day),
      End: () => addDays(weekStart(day), 6),
      PageUp: () => turn(-1),
      PageDown: () => turn(1),
    }[event.key];
    if (target) {
      event.preventDefault();
      focusDay(target());
      return;
    }
    if (carrying && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      move(carrying, day);
      setCarrying(null);
    } else if (carrying && event.key === "Escape") {
      event.preventDefault();
      const entry = entries.find((e) => e.id === carrying);
      setCarrying(null);
      setSaid(t("bento.calendar.cancelled", { defaultValue: "Put {{label}} back.", label: entry?.label ?? "" }));
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.querySelector<HTMLButtonElement>("button")?.focus();
    }
  }

  function onEntryKeyDown(event: KeyboardEvent<HTMLButtonElement>, entry: BentoCalendarEntry) {
    const cell = event.currentTarget.closest("td");
    const siblings = cell ? [...cell.querySelectorAll<HTMLButtonElement>("button")] : [];
    const index = siblings.indexOf(event.currentTarget);
    const pickUp = onEntryMove && (event.key === " " || (event.key === "Enter" && !onEntrySelect));
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      siblings[index + (event.key === "ArrowDown" ? 1 : -1)]?.focus();
    } else if (event.key === "Escape") {
      cell?.focus();
    } else if (pickUp) {
      setCarrying(entry.id);
      setSaid(t("bento.calendar.picked", { defaultValue: "Picked up {{label}}. Choose a day and press Enter.", label: entry.label }));
      cell?.focus();
    } else if (event.key === "Enter" && onEntrySelect) {
      onEntrySelect(entry.id);
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function onDrop(event: DragEvent<HTMLTableCellElement>, day: Civil) {
    const id = dragging ?? event.dataTransfer.getData("text/plain");
    setDragging(null);
    if (!id) return;
    event.preventDefault();
    move(id, day);
  }

  const hint = onEntryMove ? hintId : undefined;

  return (
    <div data-slot="bento-calendar" className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <NavButton label={t("bento.calendar.previous", { defaultValue: "Previous" })} onClick={() => setFocused(turn(-1))}>
            <IconChevronLeft size={16} aria-hidden="true" />
          </NavButton>
          <NavButton label={t("bento.calendar.next", { defaultValue: "Next" })} onClick={() => setFocused(turn(1))}>
            <IconChevronRight size={16} aria-hidden="true" />
          </NavButton>
          <button
            type="button"
            onClick={() => setFocused(dayOf(Date.now()))}
            className="inline-flex h-(--vg-control-dense) items-center rounded-md border border-border px-3 text-sm hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {t("bento.calendar.today", { defaultValue: "Today" })}
          </button>
          <h2 className="m-0 ml-2 text-base font-semibold" aria-live="polite">
            {title}
          </h2>
        </div>
        <div role="group" aria-label={t("bento.calendar.views", { defaultValue: "View" })} className="flex gap-1">
          {(["month", "week"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={shown === option ? "true" : "false"}
              onClick={() => changeView(option)}
              className={cn(
                "inline-flex h-(--vg-control-dense) items-center rounded-md border border-border px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring",
                shown === option ? "bg-primary text-primary-foreground" : "hover:bg-muted/50",
              )}
            >
              {option === "month"
                ? t("bento.calendar.month", { defaultValue: "Month" })
                : t("bento.calendar.week", { defaultValue: "Week" })}
            </button>
          ))}
        </div>
      </div>

      <span role="status" aria-live="polite" className="sr-only">
        {said}
      </span>
      {hint && (
        <span id={hint} className="sr-only">
          {t("bento.calendar.moveHint", {
            defaultValue: "Space picks this up to move it: the arrow keys choose a day, Enter drops it and Escape cancels.",
          })}
        </span>
      )}

      <table role="grid" aria-label={label ?? title} className="w-full table-fixed border-collapse text-sm">
        <thead>
          <tr>
            {weeks[0].map((day) => (
              <th
                key={civilKey(day)}
                scope="col"
                abbr={utcFormat({ weekday: "long" }).format(civilUtc(day))}
                className="pb-1 text-xs font-medium text-muted-foreground"
              >
                {utcFormat({ weekday: "short" }).format(civilUtc(day))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={civilKey(week[0])}>
              {week.map((day) => {
                const key = civilKey(day);
                const list = byDay.get(key) ?? [];
                const isFocused = key === civilKey(focused);
                const outside = shown === "month" && day.m !== focused.m;
                const count = list.length;
                return (
                  <td
                    key={key}
                    ref={(el) => {
                      if (el) cells.current.set(key, el);
                      else cells.current.delete(key);
                    }}
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={
                      count > 0
                        ? `${fullDay(day)}, ${t("bento.calendar.entries", { defaultValue: "{{count}} scheduled", count })}`
                        : fullDay(day)
                    }
                    aria-current={key === today ? "date" : undefined}
                    data-day={key}
                    onKeyDown={(event) => onCellKeyDown(event, day)}
                    onFocus={() => {
                      if (!isFocused) setFocused(day);
                    }}
                    onDragOver={(event) => {
                      if (dragging) event.preventDefault();
                    }}
                    onDrop={(event) => onDrop(event, day)}
                    className={cn(
                      "border border-border/60 p-1 align-top outline-none",
                      shown === "month" ? "h-24" : "h-48",
                      "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      carrying && isFocused && "bg-primary/10",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mb-1 inline-grid size-6 place-items-center rounded-full text-xs",
                        key === today && "bg-primary font-semibold text-primary-foreground",
                        key !== today && outside && "text-muted-foreground",
                      )}
                    >
                      {day.d}
                    </span>
                    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                      {list.map(({ entry, time }) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            data-look="text"
                            tabIndex={-1}
                            draggable={onEntryMove ? true : undefined}
                            aria-describedby={hint}
                            aria-pressed={onEntryMove ? (carrying === entry.id ? "true" : "false") : undefined}
                            data-entry={entry.id}
                            onKeyDown={(event) => onEntryKeyDown(event, entry)}
                            onClick={() => onEntrySelect?.(entry.id)}
                            onDragStart={(event) => {
                              event.dataTransfer.setData("text/plain", entry.id);
                              event.dataTransfer.effectAllowed = "move";
                              setDragging(entry.id);
                            }}
                            onDragEnd={() => setDragging(null)}
                            className={cn(
                              "flex w-full min-w-0 items-baseline gap-1 rounded-md px-1 py-0.5 text-left text-xs focus-visible:outline-2 focus-visible:outline-ring",
                              entry.tone ? TONE[entry.tone] : "bg-muted",
                              carrying === entry.id && "outline-2 outline-dashed outline-primary",
                            )}
                          >
                            <time dateTime={new Date(time).toISOString()} className="flex-none tabular-nums">
                              {timeOf(time)}
                            </time>
                            <span className="truncate">{entry.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NavButton({ label, onClick, children }: Readonly<{ label: string; onClick: () => void; children: ReactNode }>) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-(--vg-control-dense) place-items-center rounded-md border border-border hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}
