/**
 * The light/dark rule every product site follows: the page follows the OS, and
 * a stored choice overrides it. The choice is the `data-theme` attribute on the
 * document element, which is also what the preset's dark variant reads.
 *
 * Two halves. `siteThemeScript` is the pre-paint half, inlined in the page head
 * so a stored choice applies before the first frame. `createSiteTheme` is the
 * runtime half, which the toggle uses. Both take the storage key, which each
 * product names for itself.
 */

export type SiteTheme = "light" | "dark"

export interface SiteThemeRuntime {
  /** The stored choice, or null when there is none or storage is unavailable. */
  stored(): SiteTheme | null
  /** What the OS prefers. */
  system(): SiteTheme
  /** What the page is showing: the stored choice, else the OS. */
  effective(): SiteTheme
  /** Set the attribute and remember the choice. */
  apply(theme: SiteTheme): void
  /** Flip to the other theme, remember it, and return it. */
  toggle(): SiteTheme
}

export function createSiteTheme(storageKey: string): SiteThemeRuntime {
  const stored = (): SiteTheme | null => {
    try {
      const value = localStorage.getItem(storageKey)
      return value === "light" || value === "dark" ? value : null
    } catch {
      return null
    }
  }
  const system = (): SiteTheme =>
    typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  const effective = () => stored() ?? system()
  const apply = (theme: SiteTheme) => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(storageKey, theme)
    } catch {
      // No storage: the attribute still holds for this page's lifetime.
    }
  }
  const toggle = () => {
    const next: SiteTheme = effective() === "dark" ? "light" : "dark"
    apply(next)
    return next
  }
  return { stored, system, effective, apply, toggle }
}

/**
 * The pre-paint script, as source to inline in `<head>`: the stored choice,
 * else the OS preference, set as `data-theme` before the first frame. The
 * preset's dark ground keys on that attribute and has no media query of its
 * own, so the script states the OS preference too.
 */
export function siteThemeScript(storageKey: string): string {
  const key = JSON.stringify(storageKey)
  return (
    `(function(){var t=null;try{t=localStorage.getItem(${key})}catch(e){}` +
    `if(t!=="light"&&t!=="dark")t=window.matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
    `document.documentElement.setAttribute("data-theme",t)})();`
  )
}
