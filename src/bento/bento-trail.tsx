import { IconChevronRight } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

/** One ancestor on a hero's trail: where it is and what it is called. */
export interface BentoTrailStep {
  to: string;
  label: ReactNode;
}

/** Steps shown in full; past this the middle collapses to an ellipsis. */
const VISIBLE = 4;

/**
 * VDS184 — where a nested entity is, drawn where the hero's back link sits.
 *
 * A back link names one parent, which is enough for a product two levels deep
 * and not for a CMS, where a post lives in a site, a folder and any depth of
 * subfolders, and is reached from search or a review queue as often as from its
 * folder. The trail lists the ancestors in order, each a link, the last being
 * the entity's parent: the title below is the entity itself.
 *
 * The product passes the steps the way it passes `backTo`, so the hierarchy
 * stays the product's and the package only draws it. Past four steps the middle
 * collapses to an ellipsis on screen; the collapsed steps stay in the list for a
 * screen reader, which is told the whole location.
 *
 * A hero given one step renders the arrow back link instead, not this, so a
 * route with one parent reads as it always has.
 */
export function BentoTrail({ steps }: Readonly<{ steps: readonly BentoTrailStep[] }>) {
  const { t } = useTranslation();
  const collapsed = steps.length > VISIBLE;
  // Keep the root and the nearest two, which say where the tree starts and
  // where the reader is; everything between is the part a reader rarely needs.
  const hidden = (index: number) => collapsed && index > 0 && index < steps.length - 2;

  return (
    <nav aria-label={t("bento.trail.label", { defaultValue: "Location" })} data-slot="bento-trail">
      <ol className="flex min-w-0 flex-wrap items-center gap-1">
        {steps.map((step, index) => (
          <li
            key={`${step.to}-${index}`}
            className={hidden(index) ? "sr-only" : "inline-flex min-w-0 items-center gap-1"}
          >
            {index > 0 && !hidden(index) && <IconChevronRight size={12} aria-hidden className="shrink-0 opacity-60" />}
            <Link to={step.to} className="max-w-[16ch] truncate hover:text-foreground">
              {step.label}
            </Link>
            {collapsed && index === 0 && (
              <span aria-hidden className="inline-flex items-center gap-1">
                <IconChevronRight size={12} className="shrink-0 opacity-60" />…
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
