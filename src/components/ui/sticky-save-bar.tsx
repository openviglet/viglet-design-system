import { IconDeviceFloppy, IconX } from "@tabler/icons-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "./badge"
import { GradientButton } from "./gradient-button"

const variantClasses = {
  gray: "bg-gray-50 dark:bg-gray-950/30",
  blue: "bg-blue-50 dark:bg-blue-950/30",
  orange: "bg-orange-50 dark:bg-orange-950/30",
  green: "bg-green-50 dark:bg-green-950/30",
} as const

type StickySaveBarVariant = keyof typeof variantClasses

interface StickySaveBarProps {
  title: string
  badges?: ReactNode
  actions?: ReactNode
  onCancel?: () => void
  loading?: boolean
  disabled?: boolean
  variant?: StickySaveBarVariant
}

/**
 * A console-era bar that sticks to the top of a form with its title, badges, and
 * Save and Cancel buttons.
 *
 * A bento form's save bar is the hero's morph instead, through `BentoFormHero` or
 * `BentoEntityShell`: never a permanently visible sticky bar.
 */
function StickySaveBar({ title, badges, actions, onCancel, loading, disabled, variant = "gray" }: Readonly<StickySaveBarProps>) {
  const { t } = useTranslation()

  return (
    <div className={`sticky top-0 z-10 border rounded-lg px-4 py-3 flex items-center justify-between gap-4 ${variantClasses[variant]}`}>
      <div className="flex items-center gap-3 min-w-0">
        <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
        {badges && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badges}
          </div>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        {actions ?? (
          <>
            <GradientButton type="submit" size="sm" loading={loading} disabled={disabled}>
              <IconDeviceFloppy className="size-4" />
              {t("forms.formActions.saveChanges")}
            </GradientButton>
            {onCancel && (
              <GradientButton type="button" variant="outline" size="sm" onClick={onCancel}>
                <IconX className="size-4" />
                {t("forms.formActions.cancel")}
              </GradientButton>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function StickySaveBarBadge({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Badge variant="outline" className="text-xs">
      {children}
    </Badge>
  )
}

StickySaveBar.Badge = StickySaveBarBadge

export { StickySaveBar }
export type { StickySaveBarProps, StickySaveBarVariant }
