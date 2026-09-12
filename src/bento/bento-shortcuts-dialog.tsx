import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IconKeyboard } from "@tabler/icons-react";
import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { BENTO_SHELL_SHORTCUTS, bentoShortcutKeys, isMacPlatform, type BentoShellAction } from "./bento-shell-shortcuts";

export interface BentoShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** True on macOS, which swaps Ctrl for the ⌘ glyph. Detected from the platform when omitted. */
  isMac?: boolean;
}

/**
 * The keyboard-shortcut guide (T572): a reference sheet for the shortcuts the
 * bento shell binds and the keys that drive the command palette.
 *
 * Its global rows are `BENTO_SHELL_SHORTCUTS`, the set `useBentoShellShortcuts`
 * binds (VDS149), one row per action with each key that reaches it. It used to
 * be its own list, and a product binding a different key got a guide to a key
 * that did nothing.
 */
export function BentoShortcutsDialog({ open, onOpenChange, isMac = isMacPlatform() }: Readonly<BentoShortcutsDialogProps>) {
  const { t } = useTranslation();

  const actionLabel: Record<BentoShellAction, string> = {
    palette: t("bento.palette.open", { defaultValue: "Open command palette" }),
    shortcuts: t("bento.shortcuts.openGuide", { defaultValue: "Show keyboard shortcuts" }),
  };
  const actions = [...new Set(BENTO_SHELL_SHORTCUTS.map((shortcut) => shortcut.action))];

  const groups: { heading: string; rows: { id: string; combos: string[][]; label: string }[] }[] = [
    {
      heading: t("bento.shortcuts.global", { defaultValue: "Global" }),
      rows: actions.map((action) => ({
        id: action,
        label: actionLabel[action],
        combos: BENTO_SHELL_SHORTCUTS.filter((shortcut) => shortcut.action === action).map((shortcut) =>
          bentoShortcutKeys(shortcut, isMac),
        ),
      })),
    },
    {
      heading: t("bento.shortcuts.palette", { defaultValue: "Command palette" }),
      rows: [
        { id: "navigate", combos: [["↑", "↓"]], label: t("bento.shortcuts.navigate", { defaultValue: "Move between results" }) },
        { id: "open", combos: [["↵"]], label: t("bento.shortcuts.openSelected", { defaultValue: "Open the selected area" }) },
        { id: "dismiss", combos: [["Esc"]], label: t("bento.shortcuts.dismiss", { defaultValue: "Close the palette or a dialog" }) },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconKeyboard size={20} className="bento-accent-icon" />
            {t("bento.shortcuts.title", { defaultValue: "Keyboard shortcuts" })}
          </DialogTitle>
          <DialogDescription>
            {t("bento.shortcuts.description", { defaultValue: "Move around without leaving the keyboard." })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.heading}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.heading}
              </h3>
              <ul className="flex flex-col gap-1.5">
                {group.rows.map((row) => (
                  <li key={row.id} data-shortcut={row.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-foreground">{row.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {row.combos.map((combo, index) => (
                        <Fragment key={combo.join("+")}>
                          {index > 0 && (
                            <span className="px-0.5 text-[11px] text-muted-foreground">
                              {t("bento.shortcuts.or", { defaultValue: "or" })}
                            </span>
                          )}
                          {combo.map((key) => (
                            <kbd
                              key={key}
                              className="inline-flex min-w-6 items-center justify-center rounded-md border border-border/60 bg-muted px-1.5 py-0.5 text-[11px] font-medium tracking-wide"
                            >
                              {key}
                            </kbd>
                          ))}
                        </Fragment>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
