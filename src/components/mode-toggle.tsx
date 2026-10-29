import { Monitor, Moon, Sun } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * A header button opening a menu of the light, dark and system themes. It sets
 * the theme through `ThemeProvider`, which has to be mounted above it.
 *
 * VDS234 — a utility control, so a neutral ghost icon like the avatar beside it:
 * the accent outline it used to carry read as focused or selected on every route.
 */
export function ModeToggle() {
  const { setTheme } = useTheme()
  const { t } = useTranslation()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground data-[state=open]:bg-accent">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">{t("theme.toggle")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t("theme.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const THEME_OPTIONS = [
  { value: "light", labelKey: "theme.light", icon: Sun },
  { value: "dark", labelKey: "theme.dark", icon: Moon },
  { value: "system", labelKey: "theme.system", icon: Monitor },
] as const

/**
 * The theme control for a console sidebar on a small screen: one row that cycles
 * through light, dark and system. Hidden from `md` up, where `ModeToggle` sits in
 * the header.
 */
export function ModeToggleSidebar() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const current = THEME_OPTIONS.find((o) => o.value === theme) ?? THEME_OPTIONS[2]

  function cycleTheme() {
    const idx = THEME_OPTIONS.findIndex((o) => o.value === theme)
    const next = THEME_OPTIONS[(idx + 1) % THEME_OPTIONS.length]
    setTheme(next.value)
  }

  const CurrentIcon = current.icon

  return (
    <button
      type="button"
      title={t("theme.toggle")}
      onClick={cycleTheme}
      className="md:hidden flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors w-full"
    >
      <CurrentIcon className="size-4 shrink-0" />
      <span>{t("theme.modeLabel", { mode: t(current.labelKey) })}</span>
    </button>
  )
}
