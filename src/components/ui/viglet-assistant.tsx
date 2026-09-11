import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

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

export interface VigletAssistantMessage {
  /** Stable identity for the row. Falls back to the index when absent. */
  id?: string;
  role: "user" | "assistant";
  text: string;
  /**
   * One thing the product can offer from inside an answer — "use this title",
   * "open the record". The label is the product's copy, so it arrives
   * translated rather than being translated here.
   */
  action?: { label: string; onSelect: () => void };
}

export interface VigletAssistantProps {
  /** What the system is doing. Drives the mascot. */
  state?: VigletAvatarState;
  /**
   * The sentence the dock says. Typed out beside the collapsed orb and shown in
   * the header when open. Product copy, already translated.
   */
  caption?: string | null;
  /** The conversation so far. Omitted along with `onSend`, there is no chat. */
  messages?: readonly VigletAssistantMessage[];
  /** An answer is in flight: the composer locks and the transcript shows it. */
  busy?: boolean;
  /** Given, the dock opens into a chat. Omitted, it is a status surface. */
  onSend?: (text: string) => void;
  /** Controlled open state. Omitted, the dock owns it. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An answer is waiting behind a collapsed dock. */
  unread?: boolean;
  /** Bump to make the mascot react to something smaller than a state change. */
  activity?: number;
  /**
   * Render in flow instead of pinned to the viewport corner. For a story, a
   * settings preview, or a product that docks it somewhere of its own.
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
 * The typing is decoration and the sentence is the content, so they are two
 * elements: a reader sees characters appear, and a screen reader is handed the
 * whole sentence at once in a live region. Announcing the animation instead
 * would read the line out one letter at a time.
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
      <span className="sr-only">{text}</span>
    </span>
  );
}

export function VigletAssistant({
  state = "idle",
  caption,
  messages,
  busy = false,
  onSend,
  open,
  defaultOpen = false,
  onOpenChange,
  unread = false,
  activity = 0,
  inline = false,
  className,
}: Readonly<VigletAssistantProps>) {
  const { t } = useTranslation();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);

  const isOpen = open ?? ownOpen;
  const canChat = typeof onSend === "function";

  const setOpen = (next: boolean) => {
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

  const rows = messages ?? [];

  return (
    <div
      className={[
        inline
          ? "relative"
          : "fixed bottom-5 right-5 z-50",
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
      {/* Collapsed, the caption sits beside the orb rather than under it: the
          dock is in a corner, and a line of text below it would run off. */}
      {!isOpen && caption && (
        <Caption
          key={caption}
          text={caption}
          className="pointer-events-none absolute bottom-11 right-[7.75rem] w-max max-w-[min(23rem,calc(100vw-9rem))] text-right text-sm font-semibold leading-snug text-foreground drop-shadow-sm"
        />
      )}

      <div className="flex flex-none items-center gap-3">
        <button
          type="button"
          aria-label={isOpen ? t("assistant.collapse") : t("assistant.open")}
          aria-expanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          className="flex-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <VigletAvatar
            state={state}
            compact={!isOpen}
            unread={unread}
            activity={activity}
            size={isOpen ? 76 : 132}
          />
        </button>

        {isOpen && (
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">{t("assistant.state")}</span>
            <span className={`text-sm font-semibold ${STATE_TONE[state]}`}>
              {t(STATE_KEY[state])}
            </span>
            {caption && (
              <Caption
                key={caption}
                text={caption}
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

      {/* No `onSend`, no conversation. Chat off is the composer absent, not a
          disabled box a person keeps trying to type in. */}
      {isOpen && canChat && (
        <>
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

            {rows.map((message, index) => (
              <div
                key={message.id ?? index}
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
            ))}

            {busy && (
              <p className="m-0 self-start px-3 py-2 text-sm text-muted-foreground">
                {t("assistant.thinking")}
              </p>
            )}
          </div>

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
        </>
      )}
    </div>
  );
}
