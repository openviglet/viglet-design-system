import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDotsVertical } from "@tabler/icons-react";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";

export type BentoActionTone = "default" | "destructive";

export interface BentoActionsMenuItem {
  /**
   * The verb's stable name, rendered as `data-action-id`, e.g. `"post.delete"`.
   * The package attaches no meaning to it; it guarantees only that every action
   * reaching the DOM carries a name a census can match, such as a product's check
   * that each console verb has an agent equivalent. Omitting it warns outside
   * production for this release, and it becomes required in the next.
   */
  id?: string;
  /** Visible label inside the menu. */
  label: string;
  /** Icon shown to the left of the label. */
  icon: ComponentType<{ size?: number }>;
  /**
   * "destructive" tints the item rose (delete / remove / clear).
   * "default" inherits muted-foreground tone.
   */
  tone?: BentoActionTone;
  /** Disable the item without removing it from the list. */
  disabled?: boolean;
  /** Triggered when the menu item is selected. */
  onSelect: () => void;
}

export interface BentoActionsMenuProps {
  /**
   * Actions to render. Order is preserved; render-time filtering
   * (e.g. "only show Delete for non-new entities") should happen
   * upstream.
   */
  actions: BentoActionsMenuItem[];
  /** Override the trigger's accessible label. Defaults to "More actions". */
  triggerLabel?: string;
}

const TONE_CLASSES: Record<BentoActionTone, string> = {
  default: "",
  destructive:
    "bento-item-danger",
};

/** Labels already warned about, so a menu that renders again warns once. */
const warnedWithoutId = new Set<string>();

/**
 * VDS142 — the deprecation path for an action with no id: a warning for one
 * release, left in `process.env.NODE_ENV` for the product's bundler to strip from
 * a production build, and then a required field.
 */
function warnWithoutId(label: string) {
  if (process.env.NODE_ENV === "production" || warnedWithoutId.has(label)) return;
  warnedWithoutId.add(label);
  console.warn(
    `BentoActionsMenu: the action "${label}" has no id. Give it a stable name, such as "post.delete": ` +
      "it is rendered as data-action-id so a console verb can be matched to an agent verb, and it becomes required in the next release.",
  );
}

/**
 * "More actions" menu for Bento detail pages — the canonical place
 * for destructive or secondary actions (Delete, Duplicate, Export).
 *
 * Renders a frosted `⋮` button as the trigger and the bento-styled
 * dropdown surface for the menu, so it visually matches
 * BentoUserMenu and other dropdowns in the bento language.
 *
 * Hidden by default behind a single icon — keeps the hero's primary
 * content uncluttered while keeping every action one click away.
 */
export function BentoActionsMenu({ actions, triggerLabel }: Readonly<BentoActionsMenuProps>) {
  const { t } = useTranslation();
  if (actions.length === 0) return null;
  for (const action of actions) if (!action.id) warnWithoutId(action.label);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel ?? t("forms.formActions.moreActions", { defaultValue: "More actions" })}
          className="bento-tile-clickable inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-card/60 text-muted-foreground backdrop-blur transition-colors duration-200 hover:text-foreground"
        >
          <IconDotsVertical size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="bento-dropdown min-w-44 p-1.5">
        {actions.map((action) => {
          const Icon = action.icon;
          const toneClass = TONE_CLASSES[action.tone ?? "default"];
          return (
            <DropdownMenuItem
              key={action.id ?? action.label}
              data-action-id={action.id}
              onSelect={action.onSelect}
              disabled={action.disabled}
              className={`bento-dropdown-item cursor-pointer gap-2 px-3 py-2 ${toneClass}`}
            >
              <Icon size={16} />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
