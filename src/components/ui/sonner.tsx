import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"
import { toast, Toaster as Sonner, type ToasterProps } from "sonner"

/**
 * VDS97 — the region every notice lands in, named by this package.
 *
 * Passing sonner no `containerAriaLabel` leaves it announcing its own default,
 * `Notifications`, in every product and every language. VDS93 cannot see that
 * and should not: there is no literal here to find. The English belongs to a
 * dependency, and the omission is the defect — which is the shape worth
 * remembering, because a gate that reads this package's source is blind to all
 * of it.
 *
 * The hotkey sonner appends is a key name and stays as the platform spells it.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const { t } = useTranslation()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      // Before the spread, so a product with a word of its own still wins.
      containerAriaLabel={t("common.notifications", { defaultValue: "Notifications" })}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--vg-popover)",
          "--normal-text": "var(--vg-popover-foreground)",
          "--normal-border": "var(--vg-border)",
          "--border-radius": "var(--vg-radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { toast, Toaster }
