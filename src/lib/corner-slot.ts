import { createContext, useContext } from "react";

/**
 * VDS133 — whether a component is being laid out in the shell's corner stack.
 *
 * The assistant dock and the back-to-top control each pinned themselves to the
 * bottom-right corner, four pixels apart and a z-index apart, so the dock covered
 * the button on every long page. The corner is a region, and a region has one
 * owner: `BentoShell` renders both in a stack and sets this, and each component
 * then renders in flow instead of fixing itself to the viewport.
 *
 * Deliberately not a provider a product mounts. Only the shell sets it, and a
 * component rendered anywhere else reads the default and keeps its own corner.
 */
export const CornerSlotContext = createContext(false);

export function useInCornerSlot(): boolean {
  return useContext(CornerSlotContext);
}
