import { IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { useInCornerSlot } from "@/lib/corner-slot";

import { Button } from "./button";
import { Input } from "./input";
import { VigletAvatar, type VigletAvatarState } from "./viglet-avatar";

/**
 * VigletAssistant — the dock the mascot lives in.
 *
 * Collapsed it is a status light with a caption beside it; open it is a panel
 * with a transcript and a composer. Both halves are optional in the sense that
 * matters: without `onSend` there is no composer and no chat, and the dock is a
 * place the system reports from.
 *
 * It knows no backend. The original design posts to an LLM endpoint from the
 * browser with a model id inline; a package six products install cannot hold an
 * endpoint, let alone a key, so this takes `messages`, `busy` and `onSend` and
 * leaves all of that to the product.
 */

/**
 * Something the product can offer from a row — "use this title", "open the
 * record". The label is the product's copy, so it arrives translated rather than
 * being translated here.
 */
export interface VigletAssistantAction {
  label: string;
  onSelect: () => void;
}

/** A turn of the conversation: what a person asked, or what the assistant said. */
export interface VigletAssistantChatMessage {
  /** Stable identity for the row. Falls back to the index when absent. */
  id?: string;
  role: "user" | "assistant";
  text: string;
  /** One thing the product can offer from inside an answer. */
  action?: VigletAssistantAction;
}

/**
 * VDS134 — something the system reports: a publish, a failure, an arrival.
 *
 * Not a chat role. A product that reports through the dock used to have to
 * invent an assistant message for it, which put the system's words in the
 * mascot's mouth and made an agent's reply indistinguishable from a publish
 * receipt. A report has a tone, a time, a read state and its own actions, and it
 * never opens the composer.
 */
export interface VigletAssistantReport {
  /** Required: the product persists read and dismissed state against it. */
  id: string;
  role: "report";
  /** What the report is about, in the mascot's five states. */
  tone: VigletAvatarState;
  /** What happened. Product copy, already translated. */
  text: string;
  /** When it happened. */
  at: Date | number | string;
  read?: boolean;
  /** Up to three; a fourth is not rendered, since a report is not a menu. */
  actions?: readonly VigletAssistantAction[];
}

export type VigletAssistantMessage = VigletAssistantChatMessage | VigletAssistantReport;

export interface VigletAssistantProps {
  /**
   * What the system is doing. Drives the mascot. Omitted, it follows the newest
   * unread report's tone, and is idle when there is none.
   */
  state?: VigletAvatarState;
  /**
   * The sentence the dock says. Typed out beside the collapsed orb and shown in
   * the header when open. Product copy, already translated. Omitted, it is the
   * newest unread report's text; `null` says nothing.
   */
  caption?: string | null;
  /** The conversation and the reports, oldest first. */
  messages?: readonly VigletAssistantMessage[];
  /** An answer is in flight: the composer locks and the transcript shows it. */
  busy?: boolean;
  /** Given, the dock opens into a chat. Omitted, it is a status surface. */
  onSend?: (text: string) => void;
  /** Controlled open state. Omitted, the dock owns it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * How many things are waiting behind a collapsed dock. `true` marks that
   * something is without a number. Omitted, it counts the unread reports.
   */
  unread?: boolean | number;
  /**
   * A report was on screen in the open dock. Called for each unread one when the
   * dock opens or closes, so the product flips `read` and persists it.
   */
  onRead?: (id: string) => void;
  /** Given, each report offers to be dismissed, and this is told which. */
  onDismiss?: (id: string) => void;
  /** Bump to make the mascot react to something smaller than a state change. */
  activity?: number;
  /**
   * Render in flow instead of pinned to the viewport corner. For a story, a
   * settings preview, or a product that docks it somewhere of its own. Inside
   * `BentoShell`'s `dock` slot it is in flow already: the shell owns the corner.
   */
  inline?: boolean;
  className?: string;
}

const STATE_KEY: Record<VigletAvatarState, string> = {
  idle: "assistant.idle",
  working: "assistant.working",
  success: "assistant.success",
  error: "assistant.error",
  attention: "assistant.attention",
};

const STATE_TONE: Record<VigletAvatarState, string> = {
  idle: "text-muted-foreground",
  working: "text-amber-600 dark:text-amber-400",
  success: "text-emerald-700 dark:text-emerald-400",
  error: "text-destructive",
  attention: "text-amber-700 dark:text-amber-300",
};

/** How many actions a report renders. */
const REPORT_ACTIONS = 3;

function isReport(message: VigletAssistantMessage): message is VigletAssistantReport {
  return message.role === "report";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The caption, typed out the way a film subtitle arrives.
 *
 * The typing is decoration and the sentence is the content. A screen reader is
 * handed the sentence by the dock's one live region, not by this, so the typing
 * is hidden from it rather than read out a letter at a time.
 *
 * Mount this with `key={text}` — a new sentence is a new caption, which is what
 * resets the reveal without an effect writing state on the way past.
 */
function Caption({ text, className }: Readonly<{ text: string; className?: string }>) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const total = text.length;
    if (total === 0) return;

    // Reduced motion still gets the sentence, just not the performance. Set from
    // a timer rather than in the effect body so the first commit is the same one
    // every other reader gets.
    if (prefersReducedMotion()) {
      const id = setTimeout(() => setShown(total), 0);
      return () => clearTimeout(id);
    }

    // A long sentence types faster, so the dock never holds the floor for longer
    // than it takes to read.
    const step = Math.max(14, Math.min(34, 1400 / total));
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= total) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, step);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span className={className}>
      <span aria-hidden="true">
        {text.slice(0, shown)}
        {shown < text.length && (
          <span className="ml-px inline-block h-[0.95em] w-px translate-y-[0.15em] bg-current align-baseline motion-safe:animate-pulse" />
        )}
      </span>
    </span>
  );
}

/** A report's time, as the reader's locale writes it: the time today, a date before. */
function ReportTime({ at, locale }: Readonly<{ at: VigletAssistantReport["at"]; locale?: string }>) {
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return null;
  const today = date.toDateString() === new Date().toDateString();
  const label = new Intl.DateTimeFormat(
    locale,
    today ? { timeStyle: "short" } : { dateStyle: "short", timeStyle: "short" },
  ).format(date);
  return (
    <time dateTime={date.toISOString()} className="text-muted-foreground">
      {label}
    </time>
  );
}

export function VigletAssistant({
  state,
  caption,
  messages,
  busy = false,
  onSend,
  open,
  defaultOpen = false,
  onOpenChange,
  unread,
  onRead,
  onDismiss,
  activity = 0,
  inline = false,
  className,
}: Readonly<VigletAssistantProps>) {
  const { t, i18n } = useTranslation();
  // In the shell's corner stack the shell holds the corner, so the dock is in
  // flow there and takes pointer events back from the stack that positions it.
  const slotted = useInCornerSlot();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  const rows = messages ?? [];
  const reports = rows.filter(isReport);
  const waiting = reports.filter((report) => !report.read);
  const newest = waiting[waiting.length - 1];

  const isOpen = open ?? ownOpen;
  const canChat = typeof onSend === "function";
  const mood = state ?? newest?.tone ?? "idle";
  const said = caption === undefined ? (newest?.text ?? null) : caption;
  const count = typeof unread === "number" ? unread : waiting.length;
  const pending = unread === true || count > 0;

  /**
   * The one live region, and what it last said.
   *
   * It changes only when the sentence does, so a re-render, or opening and
   * closing the dock, never says a report twice. While the dock is open it stays
   * quiet: the transcript is a log, which announces a new row itself.
   */
  const [spoken, setSpoken] = useState({ source: said, text: isOpen ? "" : (said ?? "") });
  if (spoken.source !== said) {
    setSpoken({ source: said, text: isOpen ? "" : (said ?? "") });
  }

  const setOpen = (next: boolean) => {
    // Whatever was listed while the dock was open has been seen: on opening, the
    // reports waiting now; on closing, any that arrived while it was open.
    if (next !== isOpen) {
      for (const report of waiting) onRead?.(report.id);
    }
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  // Follow the conversation down. A transcript that stays put while an answer
  // arrives below the fold reads as the assistant having said nothing.
  useEffect(() => {
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const send = () => {
    const text = draft.trim();
    if (!text || busy || !onSend) return;
    onSend(text);
    setDraft("");
  };

  const orbLabel = isOpen
    ? t("assistant.collapse")
    : [t("assistant.open"), count > 0 ? t("assistant.unreadCount", { count }) : null]
        .filter(Boolean)
        .join(", ");

  return (
    <div
      className={[
        inline || slotted
          ? "relative"
          : "fixed bottom-5 right-5 z-50",
        slotted ? "pointer-events-auto" : "",
        "flex flex-col",
        isOpen
          ? "w-[min(22.5rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl"
          : "w-[8.25rem] items-end",
        className ?? "",
      ].join(" ")}
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) setOpen(false);
      }}
    >
      <span role="status" aria-live="polite" className="sr-only">
        {spoken.text}
      </span>

      {/* Collapsed, the caption sits beside the orb rather than under it: the
          dock is in a corner, and a line of text below it would run off. */}
      {!isOpen && said && (
        <Caption
          key={said}
          text={said}
          className="pointer-events-none absolute bottom-11 right-[7.75rem] w-max max-w-[min(23rem,calc(100vw-9rem))] text-right text-sm font-semibold leading-snug text-foreground drop-shadow-sm"
        />
      )}

      <div className="flex flex-none items-center gap-3">
        <button
          type="button"
          aria-label={orbLabel}
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          className="relative flex-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <VigletAvatar
            state={mood}
            compact={!isOpen}
            unread={pending}
            activity={activity}
            size={isOpen ? 76 : 132}
          />
          {!isOpen && count > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-5 top-5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.6875rem] font-semibold leading-none text-primary-foreground"
            >
              {count}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("assistant.state")}</span>
            <span className={`text-sm font-semibold ${STATE_TONE[mood]}`}>
              {t(STATE_KEY[mood])}
            </span>
            {said && (
              <Caption
                key={said}
                text={said}
                className="text-xs leading-snug text-muted-foreground"
              />
            )}
          </div>
        )}

        {isOpen && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-none self-start"
            onClick={() => setOpen(false)}
          >
            {t("assistant.collapseAction")}
          </Button>
        )}
      </div>

      {/* No `onSend` and no reports, nothing to list. Chat off is the composer
          absent, not a disabled box a person keeps trying to type in; a report
          is read here and never opens a composer of its own. */}
      {isOpen && (canChat || reports.length > 0) && (
        <div
          ref={transcriptRef}
          role="log"
          aria-label={t("assistant.transcript")}
          aria-busy={busy}
          className="mt-3 flex max-h-96 min-h-32 flex-1 flex-col gap-2.5 overflow-y-auto pr-1"
        >
          {rows.length === 0 && !busy && (
            <p className="m-auto max-w-52 text-center text-xs leading-relaxed text-muted-foreground">
              {t("assistant.empty")}
            </p>
          )}

          {rows.map((message, index) =>
            isReport(message) ? (
              <div
                key={message.id}
                data-kind="report"
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  message.read ? "border-border/60" : "border-border bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <span aria-hidden="true" className={`size-2 flex-none rounded-full bg-current ${STATE_TONE[message.tone]}`} />
                  <span className="font-semibold">{t(STATE_KEY[message.tone])}</span>
                  <ReportTime at={message.at} locale={i18n?.resolvedLanguage} />
                  {!message.read && (
                    <span className="rounded-full border border-border px-1.5 leading-4">
                      {t("assistant.new")}
                    </span>
                  )}
                  {onDismiss && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-6"
                      aria-label={t("assistant.dismiss")}
                      onClick={() => onDismiss(message.id)}
                    >
                      <IconX aria-hidden="true" size={14} />
                    </Button>
                  )}
                </div>
                <p className="m-0 mt-1 whitespace-pre-wrap leading-snug">{message.text}</p>
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.slice(0, REPORT_ACTIONS).map((action) => (
                      <Button key={action.label} variant="outline" size="sm" onClick={action.onSelect}>
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div
                key={message.id ?? index}
                data-kind={message.role}
                className={
                  message.role === "user"
                    ? "max-w-[92%] self-end rounded-xl rounded-br-sm bg-accent px-3 py-2 text-sm text-accent-foreground"
                    : "max-w-[92%] self-start rounded-xl rounded-bl-sm border border-border px-3 py-2 text-sm"
                }
              >
                <p className="m-0 whitespace-pre-wrap leading-snug">{message.text}</p>
                {message.action && (
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 h-auto whitespace-normal p-0 text-left"
                    onClick={message.action.onSelect}
                  >
                    {message.action.label}
                  </Button>
                )}
              </div>
            ),
          )}

          {busy && (
            <p className="m-0 self-start px-3 py-2 text-sm text-muted-foreground">
              {t("assistant.thinking")}
            </p>
          )}
        </div>
      )}

      {isOpen && canChat && (
        <div className="mt-3 flex flex-none gap-2">
          <Input
            value={draft}
            disabled={busy}
            placeholder={t("assistant.placeholder")}
            aria-label={t("assistant.placeholder")}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                send();
              }
            }}
          />
          <Button
            variant="outline"
            disabled={busy || draft.trim().length === 0}
            onClick={send}
          >
            {t("assistant.send")}
          </Button>
        </div>
      )}
    </div>
  );
}
