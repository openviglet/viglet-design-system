import { useCallback, useMemo, useSyncExternalStore } from "react"

import { createSiteTheme, type SiteTheme } from "./site-theme"

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/** Re-read when the attribute changes (this toggle, another one, the pre-paint script) or the OS flips. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null
  media?.addEventListener?.("change", onChange)
  return () => {
    observer.disconnect()
    media?.removeEventListener?.("change", onChange)
  }
}

/**
 * The light/dark switch for a product site, stored under the product's own key.
 *
 * It renders `dark` on the server and the real theme once hydrated, so a
 * prerendered page hydrates without a mismatch. The icon shows what a click
 * switches to, and `label` words the accessible name for the theme it names,
 * in the product's language: `(next) => \`Switch to ${next} theme\``.
 */
export function SiteThemeToggle({
  storageKey,
  label,
}: {
  storageKey: string
  label: (next: SiteTheme) => string
}) {
  const runtime = useMemo(() => createSiteTheme(storageKey), [storageKey])
  const current = useCallback(
    (): SiteTheme => {
      const shown = document.documentElement.dataset.theme
      return shown === "light" || shown === "dark" ? shown : runtime.effective()
    },
    [runtime],
  )
  const theme = useSyncExternalStore(subscribe, current, (): SiteTheme => "dark")

  const next: SiteTheme = theme === "dark" ? "light" : "dark"
  return (
    <button
      type="button"
      className="vg-site-theme-toggle"
      onClick={() => runtime.apply(next)}
      aria-label={label(next)}
      title={label(next)}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  )
}
