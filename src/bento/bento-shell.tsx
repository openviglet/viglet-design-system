import type { ReactNode } from "react";

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
      {rail}

      {header && (
        <header className="bento-shell-header bento-shell-bar sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 border-b border-border/40 bg-background/55 py-3 backdrop-blur-xl backdrop-saturate-150">
          <div className="flex min-w-0 items-center gap-3">{headerStart}</div>
          <div className="flex items-center gap-2">{headerEnd}</div>
        </header>
      )}

      <main data-column={column} className="bento-shell-main">
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
