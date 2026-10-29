import type { ReactNode } from "react";

import { getUserInitials } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

import { BENTO_TONES, type BentoTone, bentoChipClass } from "./bento-tones";

export interface BentoIdentityCellProps {
  /** The record's name, already a display string. Its initials draw the square. */
  name: string;
  /** A muted second line: a description, an address, a key. Truncated, never wrapped. */
  detail?: ReactNode;
  /**
   * The square's tone, for a list whose records carry a category (an agent or a
   * person, a system type). Omitted, the square is neutral.
   */
  tone?: BentoTone;
  /** A picture of the record (a thumbnail, an avatar), drawn in place of the initials. */
  image?: string;
  className?: string;
}

/**
 * The same tone for the same name, every render and in every product. Not the
 * cell's default (VDS230): a hashed hue carries no information, so pass it as
 * `tone` only where a stable colour per record is what the list wants.
 */
export function bentoToneOf(name: string): BentoTone {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return BENTO_TONES[hash % BENTO_TONES.length];
}

/**
 * VDS207 — the first column of a list: who or what a row is.
 *
 * Each console drew its own name cell, a bold name and nothing under it, so two
 * products disagreed on how a record is recognised. This one is a square (the
 * record's picture, or its initials on a muted ground, in a tone only when one
 * is passed), the name, and a muted line under it. Both lines truncate, so a long
 * address never makes a row taller than the table's `rowHeight`. It takes values
 * and fetches nothing.
 */
export function BentoIdentityCell({ name, detail, tone, image, className }: Readonly<BentoIdentityCellProps>) {
  return (
    <span data-slot="bento-identity-cell" className={cn("flex min-w-0 items-center gap-2.5", className)}>
      {image ? (
        <img aria-hidden="true" alt="" src={image} className="size-8 shrink-0 rounded-lg object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
            tone ? [bentoChipClass(tone), "text-white"] : "bg-muted text-foreground",
          )}
        >
          {getUserInitials({ name })}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {detail != null && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
    </span>
  );
}
