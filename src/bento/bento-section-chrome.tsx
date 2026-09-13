import { Children, isValidElement, type ComponentType, type ReactElement, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SectionCard, type ColorVariant } from "@/components/ui/section-card";

import { BentoFormSection, BENTO_FORM_SURFACE } from "./bento-form-section";
import type { BentoTone } from "./bento-tones";

/**
 * A section card's colour variant, mapped to the nearest bento tone. `cyan` and
 * `orange` have no tone of their own and take the closest neighbour rather than
 * inventing one — a tone is a token a product re-keys, and two more of them
 * would be two more things to keep in step.
 */
const VARIANT_TONE: Record<ColorVariant, BentoTone> = {
  blue: "blue",
  violet: "violet",
  emerald: "emerald",
  amber: "amber",
  rose: "rose",
  slate: "slate",
  cyan: "blue",
  orange: "amber",
};

interface HeaderLikeProps {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
}

export interface AdaptiveSectionCardProps {
  variant?: ColorVariant;
  /**
   * Merged onto the frosted surface rather than replacing it. This was the prop
   * the chrome switch used to drop on one of its two branches, so a form styled
   * through the wrapper lost that styling under the very chrome the wrapper
   * existed to hide (VDS111); it is asserted on both paths below for that reason.
   */
  className?: string;
  children?: ReactNode;
}

/**
 * A `SectionCard`'s markup rendered as a frosted {@link BentoFormSection}.
 * Import it aliased where you want a drop-in:
 *
 * ```tsx
 * import { AdaptiveSectionCard as SectionCard } from "@viglet/viglet-design-system/bento"
 * ```
 *
 * It reads the icon, title and description off the `Header` (or `StaticHeader`)
 * child and the fields off the `Content` child, so a form written against the
 * console's compound API renders in the bento language without being rewritten.
 * That compound API is the whole difference from `BentoFormSection`, which takes
 * the same three as props.
 *
 * It used to pick between two chromes off a provider, which is what let one form
 * live in two consoles at once while a product migrated behind a parallel route.
 * Every consumer finished that migration (VDS147), so there is one chrome left
 * and nothing to pick between.
 */
function AdaptiveSectionCard({
  variant = "blue",
  className,
  children,
}: Readonly<AdaptiveSectionCardProps>) {
  let header: HeaderLikeProps | undefined;
  let content: ReactNode;
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const { type } = child as ReactElement;
    if (type === SectionCard.Header || type === SectionCard.StaticHeader) {
      header = (child as ReactElement<HeaderLikeProps>).props;
    } else if (type === SectionCard.Content) {
      content = (child as ReactElement<{ children?: ReactNode }>).props.children;
    }
  });

  // A section built some other way has no header to lift. It keeps the frosted
  // surface and all of its children, because losing its fields silently is the
  // failure here that would be hardest to notice.
  if (!header) {
    return <section className={cn(BENTO_FORM_SURFACE, className)}>{children}</section>;
  }

  return (
    <BentoFormSection
      icon={header.icon}
      tone={VARIANT_TONE[variant] ?? "blue"}
      title={header.title}
      description={header.description}
      className={className}
    >
      {content}
    </BentoFormSection>
  );
}

AdaptiveSectionCard.Header = SectionCard.Header;
AdaptiveSectionCard.StaticHeader = SectionCard.StaticHeader;
AdaptiveSectionCard.Content = SectionCard.Content;

export { AdaptiveSectionCard };
