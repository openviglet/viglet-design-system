import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from "react";

import { SectionCard, type ColorVariant } from "@/components/ui/section-card";

import { BentoFormSection } from "./bento-form-section";
import type { BentoTone } from "./bento-tones";

/**
 * Which chrome a section renders in. `console` is the default, so a form that
 * knows nothing about this behaves exactly as it always did.
 */
export type SectionChrome = "console" | "bento";

const SectionChromeContext = createContext<SectionChrome>("console");

/**
 * Declare the chrome for everything beneath it.
 *
 * This is what lets one form live in two consoles at once. A product migrating
 * behind a parallel route has its largest forms — a post editor, a site editor —
 * rendered in both eras for the length of the migration, and the alternative to
 * this is forking them: two copies of real field logic, drifting.
 *
 * ```tsx
 * <SectionCardChromeProvider chrome="bento">
 *   <MySharedForm />
 * </SectionCardChromeProvider>
 * ```
 */
export function SectionCardChromeProvider({
  chrome,
  children,
}: Readonly<{ chrome: SectionChrome; children: ReactNode }>) {
  return (
    <SectionChromeContext.Provider value={chrome}>{children}</SectionChromeContext.Provider>
  );
}

/**
 * The chrome the nearest provider declared.
 *
 * A shared section reads this to drop layout its other chrome imposes — the
 * console's narrow centred column has no business inside a full-width shell.
 */
export function useSectionChrome(): SectionChrome {
  return useContext(SectionChromeContext);
}

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
  /** Console chrome only — the frosted section does not collapse. */
  defaultOpen?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * A `SectionCard` that renders as a frosted {@link BentoFormSection} under a
 * `bento` {@link SectionCardChromeProvider}, and as the console's collapsible
 * card everywhere else. Import it aliased where you want a drop-in:
 *
 * ```tsx
 * import { AdaptiveSectionCard as SectionCard } from "@viglet/viglet-design-system/bento"
 * ```
 *
 * The compound markup does not change. In bento chrome it reads the icon, title
 * and description off the `Header` (or `StaticHeader`) child and the fields off
 * the `Content` child, so a form is written once and neither copy of it drifts.
 */
function AdaptiveSectionCard({
  variant = "blue",
  defaultOpen,
  className,
  children,
}: Readonly<AdaptiveSectionCardProps>) {
  const chrome = useContext(SectionChromeContext);

  let header: HeaderLikeProps | undefined;
  let content: ReactNode;
  if (chrome === "bento") {
    Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const { type } = child as ReactElement;
      if (type === SectionCard.Header || type === SectionCard.StaticHeader) {
        header = (child as ReactElement<HeaderLikeProps>).props;
      } else if (type === SectionCard.Content) {
        content = (child as ReactElement<{ children?: ReactNode }>).props.children;
      }
    });
  }

  // Bento chrome, but only where a header was recognised. A section built some
  // other way falls through to the console card rather than losing its content
  // silently, which is the failure mode that would be hardest to notice.
  if (chrome === "bento" && header) {
    return (
      <BentoFormSection
        icon={header.icon}
        tone={VARIANT_TONE[variant] ?? "blue"}
        title={header.title}
        description={header.description}
      >
        {content}
      </BentoFormSection>
    );
  }

  return (
    <SectionCard variant={variant} defaultOpen={defaultOpen} className={className}>
      {children}
    </SectionCard>
  );
}

AdaptiveSectionCard.Header = SectionCard.Header;
AdaptiveSectionCard.StaticHeader = SectionCard.StaticHeader;
AdaptiveSectionCard.Content = SectionCard.Content;

export { AdaptiveSectionCard };
