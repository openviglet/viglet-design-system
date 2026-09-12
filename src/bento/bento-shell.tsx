import { type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useInRouterContext, useLocation } from "react-router-dom";

import { CornerSlotContext } from "@/lib/corner-slot";
import { cn } from "@/lib/utils";

import { BentoBackToTop } from "./bento-back-to-top";

/**
 * How wide the reading column is, by name. Each one is a custom property in
 * `bento.css` (`--bento-column-default`, `-narrow`, `-wide`), so a product
 * re-keys a width once rather than a page picking a Tailwind class:
 *
 * - `default` — every page, unless it is one of the two below.
 * - `narrow` — a single-question form, where a long line is harder to read.
 * - `wide` — a table or a board that needs the width more than the margin.
 * - `full` — a tool that owns the viewport, such as a chat or an explorer:
 *   edge to edge, the full height, and its own internal scroll.
 */
export type BentoShellColumn = "default" | "narrow" | "wide" | "full";

export interface BentoShellProps {
  /**
   * The nav rail, already handed the product's groups. The shell reserves its
   * gutter when one is given, so no wrapper has to remember the class.
   */
  rail?: ReactNode;
  /**
   * The header's leading edge: the mark and wordmark, a back control where the
   * route has a parent, and the palette trigger.
   */
  headerStart?: ReactNode;
  /** The header's trailing edge: the locale, the ground and the signed-in user. */
  headerEnd?: ReactNode;
  /** The reading column. A page inside it sets no width, gutter or rhythm of its own. */
  column?: BentoShellColumn;
  /**
   * The assistant dock, usually a `VigletAssistant`. It takes the corner, and
   * renders in flow there without being told to.
   */
  dock?: ReactNode;
  /** Whether the back-to-top control sits in the corner, above the dock. On by default. */
  backToTop?: boolean;
  /** The routed page. */
  children?: ReactNode;
}

/**
 * VDS131 — the shell BENTO-AUTHORING §1 describes: the rail's gutter, the header,
 * `main` and the corner, each owned once, here.
 *
 * The contract gave the reading column to the shell and the package shipped only
 * the pieces around it, so every product composed its own `main` and every page
 * set its own width: three widths across six pages of one product, which is a
 * defect that exists only between screens and so is invisible reviewing any one.
 *
 * Still no provider. The rail is fixed, one width and hidden below `md`, so there
 * is no state between the pieces for a context to carry; the palette, the
 * shortcuts dialog and the product's own overlays render beside the shell.
 */
export function BentoShell({
  rail,
  headerStart,
  headerEnd,
  column = "default",
  dock,
  backToTop = true,
  children,
}: Readonly<BentoShellProps>) {
  const { t } = useTranslation();
  const inRouter = useInRouterContext();
  const mainId = useId();
  const main = useRef<HTMLElement>(null);
  const announcer = useRef<HTMLSpanElement>(null);
  const full = column === "full";
  const header = headerStart != null || headerEnd != null;
  const corner = backToTop || dock != null;

  return (
    <div
      data-slot="bento-shell"
      className={cn(
        // No `overflow-hidden` outside `full`: it would make this a scroll
        // container, and the header's `sticky` would stop latching onto the
        // document scroll.
        "relative w-full bg-background text-foreground",
        rail != null && "bento-rail-gutter",
        full ? "flex h-svh flex-col overflow-hidden" : "min-h-svh",
      )}
    >
      {/*
        VDS141 — the first thing a keyboard reaches, so a reader skips the rail
        and every header control on every page. Hidden until it has focus.
      */}
      <a
        href={`#${mainId}`}
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
        className="sr-only rounded-full border border-border/60 bg-card px-4 py-2 text-sm shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60]"
      >
        {t("bento.shell.skip", { defaultValue: "Skip to content" })}
      </a>
      <span ref={announcer} role="status" aria-live="polite" className="sr-only" />
      {inRouter && <RouteFocus main={main} announcer={announcer} />}

      {rail}

      {header && (
        <header className="bento-shell-header bento-shell-bar sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/55 py-3 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex min-w-0 items-center gap-3">{headerStart}</div>
          <div className="flex items-center gap-2">{headerEnd}</div>
        </header>
      )}

      <main
        ref={main}
        id={mainId}
        tabIndex={-1}
        aria-label={t("bento.shell.main", { defaultValue: "Main content" })}
        data-column={column}
        className="bento-shell-main"
      >
        {children}
      </main>

      {/*
        VDS133 — the corner is a region, so it has one owner. The dock and the
        back-to-top control each used to fix themselves to it, and the dock
        covered the button. Here they stack: the dock takes the corner and the
        button sits above it. The stack takes no pointer events of its own, so
        the empty part of its box never swallows a click meant for the page.
      */}
      {corner && (
        <div
          data-slot="bento-shell-corner"
          className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
        >
          <CornerSlotContext.Provider value={true}>
            {backToTop && <BentoBackToTop />}
            {dock}
          </CornerSlotContext.Provider>
        </div>
      )}
    </div>
  );
}

/**
 * VDS141 — what a single-page app owes a screen reader on navigation, done once.
 *
 * A route change swaps the page without a load, so nothing tells a screen reader
 * that anything happened and focus stays on the link that was pressed, inside a
 * page that is gone. This moves focus to the new page's h1 and says its title,
 * which no page should implement for itself.
 *
 * The heading may arrive a moment after the path (a lazy route, a query), so it
 * is looked for for up to a second before focus settles on main instead. The
 * first path is the page the reader opened, and moves nothing: a load that took
 * focus away from the browser's own place would be the opposite of the fix.
 */
function RouteFocus({
  main,
  announcer,
}: Readonly<{ main: RefObject<HTMLElement | null>; announcer: RefObject<HTMLSpanElement | null> }>) {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    // Compared with the last path rather than flagged as a first run, so a
    // development double mount still moves nothing on load.
    if (previous.current === pathname) return;
    previous.current = pathname;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const land = () => {
      const heading = main.current?.querySelector<HTMLElement>("h1") ?? null;
      if (!heading && tries++ < 20) {
        timer = setTimeout(land, 50);
        return;
      }
      if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      (heading ?? main.current)?.focus();
      // Written to the live region directly: an announcement is not state the
      // shell renders from.
      if (announcer.current) announcer.current.textContent = heading?.textContent?.trim() || document.title;
    };
    land();
    return () => clearTimeout(timer);
  }, [pathname, main, announcer]);

  return null;
}
