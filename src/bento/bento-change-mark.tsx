import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

/** What happened to an item between two versions. */
export type BentoChangeState = "added" | "removed" | "changed" | "unchanged";

export interface BentoChangeMarkProps {
  state: BentoChangeState;
  /** One letter instead of the word, for a narrow row: git's `A`, `D` and `M` by default. The word stays its name and tooltip. */
  compact?: boolean;
  className?: string;
}

const TINT: Record<BentoChangeState, string | false> = {
  added: "bento-status bento-status-on",
  removed: "bento-status bento-status-error",
  changed: "bento-status bento-status-warn",
  unchanged: false,
};

/**
 * VDS170 — one mark for created, changed and deleted, so a list of what changed
 * and the comparison it opens agree on what a change looks like.
 *
 * The chip `BentoDiff` draws beside each field, lifted out so a list can draw the
 * same words in the same tints: a file an agent touched, a page in a review
 * queue. `compact` draws one letter where a row is narrow; a letter is an
 * abbreviation, so the word is what a screen reader says and what a pointer
 * reads. It takes a state and nothing else: striking a deleted item's name is the
 * product's to draw.
 */
export function BentoChangeMark({ state, compact = false, className }: Readonly<BentoChangeMarkProps>) {
  const { t } = useTranslation();
  const word = {
    added: t("bento.diff.added", { defaultValue: "Added" }),
    removed: t("bento.diff.removed", { defaultValue: "Removed" }),
    changed: t("bento.diff.changed", { defaultValue: "Changed" }),
    unchanged: t("bento.diff.unchanged", { defaultValue: "Unchanged" }),
  }[state];

  const classes = cn("rounded-full border px-1.5 leading-4", compact && "font-mono", TINT[state], className);

  if (!compact) {
    return (
      <span data-slot="bento-change-mark" data-state={state} className={classes}>
        {word}
      </span>
    );
  }

  const letter = {
    added: t("bento.diff.addedLetter", { defaultValue: "A" }),
    removed: t("bento.diff.removedLetter", { defaultValue: "D" }),
    changed: t("bento.diff.changedLetter", { defaultValue: "M" }),
    unchanged: t("bento.diff.unchangedLetter", { defaultValue: "·" }),
  }[state];

  return (
    <span data-slot="bento-change-mark" data-state={state} title={word} className={classes}>
      <span aria-hidden="true">{letter}</span>
      <span className="sr-only">{word}</span>
    </span>
  );
}
