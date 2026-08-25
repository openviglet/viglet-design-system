import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface BentoPanelProps {
  children: ReactNode;
  /** Applied to the frosted container itself — margins, `overflow-hidden`, a width. */
  className?: string;
  /**
   * Applied to the inner content wrapper, which carries **no padding of its own**.
   *
   * A panel holds arbitrary content and the right inset depends on what that content is: a table
   * wants `p-0` so its rows reach the edge, a toolbar wants `py-2 px-4`, a message wants `p-8`.
   * Guessing one here would mean every second call site overriding it, and an override that has to
   * beat a default is the class list nobody can read.
   */
  contentClassName?: string;
}

/**
 * A frosted container with **no heading** — the shape the bento vocabulary was missing.
 *
 * `BentoTile` is a clickable tile, `BentoSection` is a heading plus a grid, `BentoFormSection` is
 * a titled form group. None of them is "a frosted box with arbitrary content in it", so every
 * consumer that needed one hand-rolled `bento-glass rounded-2xl border` at the call site — and the
 * moment two of them picked different radii the product was inconsistent for a reason invisible in
 * any diff.
 *
 * It is a distinct component rather than a `title`-less `BentoSection` because the absence of a
 * heading is the point. A stats strip, a toolbar, a listing and a 404 message all sit under a hero
 * that already names the page; a heading on any of them is noise, and `BentoSection` without a
 * title would still render its `header` element and put an empty entry in the document outline.
 *
 * The surface is `BentoSaveBar`'s, deliberately: that bar is the other frosted container with no
 * heading in this layer, and two things doing the same job should not drift apart. `bento-glass`
 * already carries the border and the blur, so this adds only the radius and the shadow.
 */
export function BentoPanel({ children, className, contentClassName }: Readonly<BentoPanelProps>) {
  return (
    <div className={cn("bento-glass rounded-2xl shadow-md", className)}>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
