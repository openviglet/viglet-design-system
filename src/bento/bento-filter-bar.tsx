import { IconChevronDown, IconSearch, IconX } from "@tabler/icons-react";
import { type ComponentProps, type ReactNode, useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** A facet whose value is one or more of a fixed set. */
export interface BentoFilterChoiceFacet {
  id: string;
  kind: "choice";
  /** The facet's name, already translated. */
  label: string;
  options: readonly { value: string; label: string }[];
  /** More than one option at a time. Defaults to one. */
  multiple?: boolean;
}

/** A facet whose value is a range of calendar dates, as `YYYY-MM-DD`. */
export interface BentoFilterDateFacet {
  id: string;
  kind: "date";
  label: string;
}

export type BentoFilterFacet = BentoFilterChoiceFacet | BentoFilterDateFacet;

export interface BentoFilterDateRange {
  from?: string;
  to?: string;
}

/** Everything the bar says, as data the product can put in a URL. */
export interface BentoFilterValue {
  query: string;
  /** By facet id: the chosen option values, or a date range. An absent or empty entry is no filter. */
  facets: Record<string, readonly string[] | BentoFilterDateRange | undefined>;
}

export interface BentoFilterBarProps {
  value: BentoFilterValue;
  /** Called once per thing a reader does: a choice, a removed chip, an applied range, a pause in typing. */
  onChange: (value: BentoFilterValue) => void;
  facets: readonly BentoFilterFacet[];
  /** The text field's placeholder and accessible name. */
  queryLabel?: string;
  /** How long typing has to pause before the query is sent, in milliseconds. */
  queryDelay?: number;
  /** Saved views, or anything else the product offers beside the filters. The bar stores nothing. */
  views?: ReactNode;
}

export const EMPTY_FILTERS: BentoFilterValue = { query: "", facets: {} };

const isRange = (value: unknown): value is BentoFilterDateRange =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const chosen = (value: BentoFilterValue["facets"][string]): readonly string[] => (Array.isArray(value) ? value : []);

function withFacet(value: BentoFilterValue, id: string, next: BentoFilterValue["facets"][string]): BentoFilterValue {
  const facets = { ...value.facets };
  const empty = next === undefined || (Array.isArray(next) && next.length === 0) || (isRange(next) && !next.from && !next.to);
  if (empty) delete facets[id];
  else facets[id] = next;
  return { ...value, facets };
}

/**
 * VDS139 — the query row, drawn once.
 *
 * A content list is filtered more than it is scrolled: drafts of one type, in one
 * locale, changed this week. Each product composed that row itself, from a search
 * input and whatever menus it had, so a reader learned it again per product.
 *
 * The bar owns no state. The product passes `value` and receives one `onChange`
 * per action, which is what lets it mirror the filters into the URL and make a
 * filtered view a link. A facet is declared by the product (its id, its words,
 * its options), so the bar holds no product vocabulary. Pass the same value as a
 * `BentoDataTable`'s `selectionScope`, and a selection never outlives the rows it
 * was made on.
 */
export function BentoFilterBar({
  value,
  onChange,
  facets,
  queryLabel,
  queryDelay = 300,
  views,
}: Readonly<BentoFilterBarProps>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState({ source: value.query, text: value.query });
  const [sent, setSent] = useState<string | null>(null);

  // The field shows what the reader typed. The query coming back as the echo of
  // what the field sent keeps it, since the reader may have typed on; a query
  // set from anywhere else, a cleared bar or a link opened, replaces it.
  if (draft.source !== value.query) {
    setDraft({ source: value.query, text: value.query === sent ? draft.text : value.query });
  }

  // One change once typing pauses, never one per keystroke.
  useEffect(() => {
    if (draft.text === value.query) return;
    const id = setTimeout(() => {
      setSent(draft.text);
      onChange({ ...value, query: draft.text });
    }, queryDelay);
    return () => clearTimeout(id);
  }, [draft.text, value, onChange, queryDelay]);

  const chips: { key: string; text: string; remove: () => BentoFilterValue }[] = [];
  for (const facet of facets) {
    const current = value.facets[facet.id];
    if (facet.kind === "choice") {
      for (const picked of chosen(current)) {
        const option = facet.options.find((o) => o.value === picked);
        chips.push({
          key: `${facet.id}:${picked}`,
          text: `${facet.label}: ${option?.label ?? picked}`,
          remove: () => withFacet(value, facet.id, chosen(current).filter((v) => v !== picked)),
        });
      }
    } else if (isRange(current) && (current.from || current.to)) {
      chips.push({
        key: facet.id,
        text: `${facet.label}: ${current.from ?? "…"} – ${current.to ?? "…"}`,
        remove: () => withFacet(value, facet.id, undefined),
      });
    }
  }

  const active = chips.length > 0 || value.query !== "";
  const searchLabel = queryLabel ?? t("bento.filters.search", { defaultValue: "Search" });

  return (
    <div
      role="search"
      aria-label={t("bento.filters.label", { defaultValue: "Filters" })}
      data-slot="bento-filter-bar"
      className="flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <IconSearch size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={draft.text}
            placeholder={searchLabel}
            aria-label={searchLabel}
            onChange={(event) => setDraft({ ...draft, text: event.target.value })}
            className="pl-9"
          />
        </div>

        {facets.map((facet) =>
          facet.kind === "choice" ? (
            <ChoiceFacet key={facet.id} facet={facet} value={value} onChange={onChange} />
          ) : (
            <DateFacet key={facet.id} facet={facet} value={value} onChange={onChange} />
          ),
        )}

        {views}
      </div>

      {active && (
        <ul className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0" aria-label={t("bento.filters.active", { defaultValue: "Active filters" })}>
          {chips.map((chip) => (
            <li key={chip.key}>
              <button
                type="button"
                aria-label={t("bento.filters.remove", { defaultValue: "Remove filter {{filter}}", filter: chip.text })}
                onClick={() => onChange(chip.remove())}
                className="bento-clear inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 py-0.5 pl-2.5 pr-1.5 text-xs"
              >
                {chip.text}
                <IconX size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
          <li>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setDraft({ source: "", text: "" });
                onChange(EMPTY_FILTERS);
              }}
            >
              {t("bento.filters.clearAll", { defaultValue: "Clear all" })}
            </Button>
          </li>
        </ul>
      )}
    </div>
  );
}

/**
 * A facet's button. It sits under a Radix trigger with `asChild`, so it has to
 * pass on the props and the ref the trigger gives it, or the menu never opens.
 */
function FacetTrigger({
  label,
  count,
  ...props
}: Readonly<{ label: string; count: number } & ComponentProps<typeof Button>>) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5" {...props}>
      {label}
      {count > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-[0.6875rem] leading-4 text-primary-foreground">{count}</span>
      )}
      <IconChevronDown size={14} aria-hidden="true" />
    </Button>
  );
}

function ChoiceFacet({
  facet,
  value,
  onChange,
}: Readonly<{ facet: BentoFilterChoiceFacet; value: BentoFilterValue; onChange: (value: BentoFilterValue) => void }>) {
  const current = chosen(value.facets[facet.id]);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FacetTrigger label={facet.label} count={current.length} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bento-dropdown min-w-44 p-1.5">
        {facet.multiple ? (
          facet.options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={current.includes(option.value)}
              onCheckedChange={(checked) =>
                onChange(
                  withFacet(
                    value,
                    facet.id,
                    checked === true ? [...current, option.value] : current.filter((v) => v !== option.value),
                  ),
                )
              }
              onSelect={(event) => event.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <DropdownMenuRadioGroup
            value={current[0] ?? ""}
            onValueChange={(picked) => onChange(withFacet(value, facet.id, picked === current[0] ? [] : [picked]))}
          >
            {facet.options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DateFacet({
  facet,
  value,
  onChange,
}: Readonly<{ facet: BentoFilterDateFacet; value: BentoFilterValue; onChange: (value: BentoFilterValue) => void }>) {
  const { t } = useTranslation();
  const current = value.facets[facet.id];
  const range = isRange(current) ? current : {};
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(range.from ?? "");
  const [to, setTo] = useState(range.to ?? "");
  const fromId = useId();
  const toId = useId();

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // Opening starts from what is applied, not from an abandoned edit.
        if (next) {
          setFrom(range.from ?? "");
          setTo(range.to ?? "");
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <FacetTrigger label={facet.label} count={range.from || range.to ? 1 : 0} />
      </PopoverTrigger>
      <PopoverContent align="start" className="bento-dropdown w-64 p-3">
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            onChange(withFacet(value, facet.id, { from: from || undefined, to: to || undefined }));
            setOpen(false);
          }}
        >
          <label htmlFor={fromId} className="text-xs text-muted-foreground">
            {t("bento.filters.from", { defaultValue: "From" })}
          </label>
          <Input id={fromId} type="date" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} />
          <label htmlFor={toId} className="text-xs text-muted-foreground">
            {t("bento.filters.to", { defaultValue: "To" })}
          </label>
          <Input id={toId} type="date" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} />
          <Button type="submit" size="sm" className="mt-1">
            {t("bento.filters.apply", { defaultValue: "Apply" })}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
