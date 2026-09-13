import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

import { bentoChipClass, type BentoTone } from "./bento-tones";

export interface BentoFormSectionProps {
  /**
   * Heading level for the section title. Defaults to `h2`: a form section sits
   * directly under the hero's `h1`, and skipping to `h3` leaves a screen reader
   * with a broken outline. Override when a section nests inside another.
   */
  as?: "h2" | "h3" | "h4";
  icon: ComponentType<{ size?: number }>;
  tone: BentoTone;
  title: string;
  description?: string;
  children: ReactNode;
  /** Optional trailing slot in the header (badges, status pill, etc.). */
  trailing?: ReactNode;
  /**
   * Merged onto the frosted surface, not applied instead of it. A form written
   * against the console's compound API reaches this through
   * `AdaptiveSectionCard`, which used to forward it on one branch only — so a
   * styled form lost its styling under one of the two chromes (VDS111).
   */
  className?: string;
}

/**
 * The frosted surface itself, as a class list rather than a second copy of one.
 * `AdaptiveSectionCard` renders a section whose header it cannot read, and a
 * pasted class list is the one a change to this surface never reaches.
 */
export const BENTO_FORM_SURFACE =
  "bento-tile bento-glass relative flex flex-col gap-5 overflow-hidden rounded-3xl p-5 md:p-6";

/**
 * Frosted-glass section wrapper for Bento forms — the form-page
 * counterpart of `BentoTile`. Groups related fields under a tonal
 * icon chip + title + description, with the same iOS-spring entry
 * and `bento-glass` surface used elsewhere in the bento language.
 *
 * Stays content-agnostic: any react-hook-form field combo can sit
 * inside `children`, so existing FormField/Input/Select/Switch
 * components are reused without modification.
 */
export function BentoFormSection({
  icon: Icon,
  tone,
  title,
  description,
  children,
  trailing,
  as: Heading = "h2",
  className,
}: Readonly<BentoFormSectionProps>) {
  return (
    <section className={cn(BENTO_FORM_SURFACE, className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid h-10 w-10 place-items-center rounded-2xl text-white shadow-md ${bentoChipClass(tone)}`}>
            <Icon size={20} />
          </span>
          <div className="flex flex-col gap-0.5">
            <Heading className="text-base font-semibold tracking-tight md:text-lg">{title}</Heading>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </header>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}
