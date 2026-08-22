import * as React from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

// Asked for each time rather than cached in a module-level variable: `window`
// is not there to ask on the server, and a cached MediaQueryList outlives the
// window it came from — which is a stale listener in a test and a leak in any
// host that replaces the document. matchMedia is a cheap lookup.
function query() {
  return window.matchMedia(MOBILE_QUERY)
}

function subscribe(onChange: () => void) {
  const mql = query()
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

/**
 * Whether the viewport is narrower than the mobile breakpoint.
 *
 * A media query is external state, so it is read through
 * `useSyncExternalStore` rather than copied into a `useState` that an effect
 * then catches up. The effect version returned `false` on the first render
 * whatever the viewport was, and corrected itself one commit later — which is
 * a layout flash on every mobile load, and the cascading render the
 * `set-state-in-effect` rule exists to name.
 */
export function useIsMobile() {
  return React.useSyncExternalStore(
    subscribe,
    () => query().matches,
    // On the server there is no viewport; the desktop layout is the safer
    // guess, and it matches what the effect version rendered first anyway.
    () => false,
  )
}
