import { IconSearch } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { BENTO_SHELL_SHORTCUTS, bentoShortcutKeys, isMacPlatform } from "./bento-shell-shortcuts";

export interface BentoPaletteTriggerProps {
  /** Open the palette: the same state `useBentoShellShortcuts` toggles. */
  onClick: () => void;
  /** Detected from the platform when omitted. */
  isMac?: boolean;
  className?: string;
}

/**
 * VDS149 — the palette trigger BENTO-AUTHORING puts in the header's leading set,
 * with the platform's own hint: ⌘K on macOS, Ctrl K everywhere else. A bare ⌘K
 * on Windows sends a reader to a key that is not there.
 *
 * On a phone the rail is hidden and this is the way to a deep area, so the word
 * stays in the accessible name at every width and only its glyph shows. The hint
 * comes from the binding set, so it cannot name a key the hook does not bind.
 */
export function BentoPaletteTrigger({ onClick, isMac = isMacPlatform(), className }: Readonly<BentoPaletteTriggerProps>) {
  const { t } = useTranslation();
  const bindings = BENTO_SHELL_SHORTCUTS.filter((shortcut) => shortcut.action === "palette");
  const chord = bindings.find((shortcut) => shortcut.mod);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts={bindings
        .map((shortcut) => (shortcut.mod ? `${isMac ? "Meta" : "Control"}+${shortcut.key.toUpperCase()}` : shortcut.key))
        .join(" ")}
      className={cn(
        "bento-tile bento-tile-clickable inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 py-1.5 pl-3 pr-2 text-sm text-muted-foreground backdrop-blur hover:text-foreground",
        className,
      )}
    >
      <IconSearch aria-hidden size={16} />
      <span className="sr-only sm:not-sr-only">{t("bento.palette.search", { defaultValue: "Search" })}</span>
      {chord && (
        <kbd
          aria-hidden
          className="hidden rounded border border-border/60 bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide sm:inline"
        >
          {bentoShortcutKeys(chord, isMac).join(isMac ? "" : " ")}
        </kbd>
      )}
    </button>
  );
}
