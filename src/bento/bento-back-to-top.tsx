import { IconArrowUp } from "@tabler/icons-react";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

const REVEAL_THRESHOLD_PX = 480;

function subscribeToScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

function scrolledPastThreshold(): boolean {
  return window.scrollY > REVEAL_THRESHOLD_PX;
}

/**
 * Floating "scroll to top" button — appears with an iOS spring
 * animation once the user has scrolled past the threshold, and
 * smooth-scrolls back to the top on click.
 *
 * Complements the sticky header rather than replacing it: the header
 * keeps navigation/branding always reachable, this button just cuts
 * the long way back when content is heavy.
 */
export function BentoBackToTop() {
  const { t } = useTranslation();
  // The scroll position is external state, so it is read through
  // `useSyncExternalStore` rather than copied into a `useState` an effect then
  // catches up. That form rendered hidden whatever the position was, so a page
  // restored to a saved offset — or opened on an anchor — showed no button and
  // then popped it in. `useIsMobile` was rewritten away from the same shape.
  const visible = useSyncExternalStore(
    subscribeToScroll,
    scrolledPastThreshold,
    // No scroll position on the server; hidden is what the effect version
    // rendered first anyway.
    () => false,
  );

  return (
    <button
      type="button"
      aria-label={t("bento.backToTop", { defaultValue: "Back to top" })}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full border border-border/60 bg-card/80 text-foreground shadow-lg backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:shadow-xl active:scale-95 ${
        visible
          ? "translate-y-0 scale-100 opacity-100"
          : "pointer-events-none translate-y-4 scale-90 opacity-0"
      }`}
    >
      <IconArrowUp size={18} />
    </button>
  );
}
