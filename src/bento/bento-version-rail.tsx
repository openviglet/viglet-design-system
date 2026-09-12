import { IconRobot, IconUser } from "@tabler/icons-react";
import { type KeyboardEvent, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

export interface BentoVersion {
  id: string;
  /** Who made it, already a display name. */
  author: string;
  /** A person, or an agent acting for one. */
  actor: "human" | "agent";
  at: Date | number | string;
  /** What changed, in a line, already translated. */
  summary?: string;
}

export interface BentoVersionRailProps {
  /** Newest first. */
  versions: readonly BentoVersion[];
  /** The one or two versions being compared, older first. */
  selected: readonly string[];
  /** Called with the new pair, older first, whenever a reader picks. */
  onSelect: (ids: string[]) => void;
  /** The rail's accessible name. */
  label?: string;
}

/**
 * VDS140 — the list of revisions two are compared from.
 *
 * Each revision shows who made it, whether a person or an agent did, and when:
 * a review of an agent's change reads differently from a colleague's, and the
 * rail says which before the diff does. It is a listbox of up to two selected
 * options: arrows move, Space or Enter picks, and a third pick lets go of the
 * one picked longest ago, so the pair is always the last two the reader chose.
 */
export function BentoVersionRail({ versions, selected, onSelect, label }: Readonly<BentoVersionRailProps>) {
  const { t, i18n } = useTranslation();
  const [focused, setFocused] = useState(0);
  // The order the reader picked in, which `selected` (sorted by age) cannot say.
  const [picks, setPicks] = useState<string[]>([]);
  const options = useRef(new Map<number, HTMLLIElement>());

  const order = (ids: string[]) =>
    // Older first: the rail is newest first, so a higher index is older.
    [...ids].sort((x, y) => versions.findIndex((v) => v.id === y) - versions.findIndex((v) => v.id === x));

  function pick(id: string) {
    if (selected.includes(id)) {
      setPicks(picks.filter((p) => p !== id));
      onSelect(selected.filter((s) => s !== id));
      return;
    }
    // Picked longest ago first: a selection set from outside counts as earliest.
    const byPick = [...selected.filter((s) => !picks.includes(s)), ...picks.filter((p) => selected.includes(p))];
    const kept = byPick.length >= 2 ? byPick.slice(byPick.length - 1) : byPick;
    setPicks([...kept, id]);
    onSelect(order([...kept, id]));
  }

  function move(index: number) {
    const target = Math.max(0, Math.min(versions.length - 1, index));
    setFocused(target);
    options.current.get(target)?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, index: number) {
    switch (event.key) {
      case "ArrowDown":
        move(index + 1);
        break;
      case "ArrowUp":
        move(index - 1);
        break;
      case "Home":
        move(0);
        break;
      case "End":
        move(versions.length - 1);
        break;
      case " ":
      case "Enter":
        pick(versions[index].id);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  const format = (at: BentoVersion["at"]) => {
    const date = new Date(at);
    return Number.isNaN(date.getTime())
      ? { iso: undefined, text: String(at) }
      : {
          iso: date.toISOString(),
          text: new Intl.DateTimeFormat(i18n?.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }).format(date),
        };
  };

  return (
    <ul
      role="listbox"
      aria-label={label ?? t("bento.versions.label", { defaultValue: "Versions" })}
      aria-multiselectable="true"
      data-slot="bento-version-rail"
      className="m-0 flex list-none flex-col gap-1 p-0"
    >
      {versions.map((version, index) => {
        const isSelected = selected.includes(version.id);
        const when = format(version.at);
        const Actor = version.actor === "agent" ? IconRobot : IconUser;
        return (
          <li
            key={version.id}
            ref={(el) => {
              if (el) options.current.set(index, el);
              else options.current.delete(index);
            }}
            role="option"
            aria-selected={isSelected ? "true" : "false"}
            tabIndex={index === Math.min(focused, versions.length - 1) ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
            onClick={() => {
              setFocused(index);
              pick(version.id);
            }}
            className={cn(
              "flex cursor-pointer flex-col gap-0.5 rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring",
              isSelected ? "border-primary/50 bg-primary/10" : "border-transparent hover:bg-muted/50",
            )}
          >
            <span className="flex items-center gap-1.5 font-medium">
              <Actor size={14} aria-hidden="true" />
              {version.author}
              <span className="text-xs font-normal text-muted-foreground">
                {version.actor === "agent"
                  ? t("bento.versions.agent", { defaultValue: "Agent" })
                  : t("bento.versions.human", { defaultValue: "Person" })}
              </span>
            </span>
            <time dateTime={when.iso} className="text-xs text-muted-foreground">
              {when.text}
            </time>
            {version.summary && <span className="text-xs">{version.summary}</span>}
          </li>
        );
      })}
    </ul>
  );
}
