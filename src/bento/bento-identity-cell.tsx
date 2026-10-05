import type { ReactNode } from "react";

import { getUserInitials } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";

import { BENTO_TONES, type BentoTone, bentoChipClass } from "./bento-tones";

export interface BentoIdentityCellProps {
  /** The record's name, already a display string. Its initials draw the square. */
  name: string;
  /** A muted second line: a description, an address, a key. Truncated, never wrapped. */
  detail?: ReactNode;
  /** The square's tone. Omitted, one is derived from the name, so a record keeps its colour. */
  tone?: BentoTone;
  className?: string;
}

/** The same tone for the same name, every render and in every product. */
function toneOf(name: string): BentoTone {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return BENTO_TONES[hash % BENTO_TONES.length];
}

/**
 * VDS207 — the first column of a list: who or what a row is.
 *
 * Each console drew its own name cell, a bold name and nothing under it, so two
 * products disagreed on how a record is recognised. This one is a square of
 * initials in a tone derived from the name, the name, and a muted line under it.
 * Both lines truncate, so a long address never makes a row taller than the
 * table's `rowHeight`. It takes values and fetches nothing.
 */
export function BentoIdentityCell({ name, detail, tone, className }: Readonly<BentoIdentityCellProps>) {
  return (
    <span data-slot="bento-identity-cell" className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span
        aria-hidden="true"
        className={cn(
          bentoChipClass(tone ?? toneOf(name)),
          "grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white",
        )}
      >
        {getUserInitials({ name })}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-foreground">{name}</span>
        {detail != null && <span className="truncate text-xs text-muted-foreground">{detail}</span>}
      </span>
    </span>
  );
}
