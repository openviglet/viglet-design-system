import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { IconArrowRight, IconExternalLink, IconSearch } from "@tabler/icons-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { bentoNavTarget, type BentoNavItem } from "./bento-nav";

/** One result a product's own search returned. */
export interface BentoCommandPaletteResult {
  id: string;
  /** Already the word a reader sees: the product owns these, not the bundles here. */
  label: string;
  description?: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

/**
 * A group of results the product fills for the query as typed (VDS123).
 *
 * The palette does not match these and never reorders them. The product asked
 * its own source, that source ranked the answer by relevance it understands, and
 * a substring match in the client would only undo that — which is why a consumer
 * whose results come from an engine owning the query could not use this
 * component at all.
 */
export interface BentoCommandPaletteGroup {
  /** Heading for the group, already translated. */
  label: string;
  /** The answer to the current query, in the order the source gave it. */
  items: BentoCommandPaletteResult[];
  /**
   * Whether the product is still resolving the query. A query that leaves the
   * process takes time, and an empty list that is not empty yet reads as "no
   * matches".
   */
  pending?: boolean;
  /** Called with the item the reader chose; the palette closes either way. */
  onSelect: (item: BentoCommandPaletteResult) => void;
}

export interface BentoCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The surfaces this reader may jump to, already filtered — the same array the
   * nav rail is given, so `⌘K` and the rail can never disagree about what
   * exists.
   *
   * A product's routes and entity names are the one thing this package must
   * never hold: a palette shipping its own array would offer one console's
   * surfaces inside another's.
   */
  items: BentoNavItem[];
  /**
   * A second group, whose items the product supplies per query. Omit it and the
   * palette is exactly the nav launcher it was.
   */
  group?: BentoCommandPaletteGroup;
  /**
   * The query as typed, so the product can answer it. Called on every change and
   * once with `""` when the palette reopens, which is the moment a product drops
   * the previous answer.
   */
  onQueryChange?: (query: string) => void;
}

/**
 * The Bento `⌘K` command palette (T549) — a keyboard-first launcher over
 * every navigable area. Built on the Radix `Dialog` primitive (zero extra
 * deps): a filter box + a flat, arrow-key-navigable result list. Migrated
 * surfaces navigate inside the bento shell; not-yet-migrated areas link out
 * to the console (marked with an external-link glyph) so the palette reaches
 * everything during the migration.
 *
 * Global open/close (⌘K / Ctrl+K) is owned by the parent shell; this
 * component only renders and drives selection while `open`.
 */
/**
 * A run of options under an optional heading. `role="group"` is what keeps the
 * heading inside the listbox without becoming an option of its own.
 */
function Section({ label, children }: Readonly<{ label?: string; children: React.ReactNode }>) {
  if (!label) return <>{children}</>;
  return (
    <div role="group" aria-label={label}>
      <p className="px-3 pt-2 pb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Option({
  index,
  active,
  icon: Icon,
  label,
  description,
  trailing,
  onActivate,
  onChoose,
}: Readonly<{
  index: number;
  active: boolean;
  icon?: ComponentType<{ size?: number; className?: string }>;
  label: string;
  description?: string;
  trailing?: React.ReactNode;
  onActivate: () => void;
  onChoose: () => void;
}>) {
  return (
    <button
      type="button"
      id={`bento-palette-opt-${index}`}
      data-index={index}
      role="option"
      aria-selected={active ? "true" : "false"}
      onMouseEnter={onActivate}
      onClick={onChoose}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "text-foreground"
      }`}
    >
      {Icon && <Icon size={18} className="shrink-0 text-muted-foreground" />}
      <span className="flex-1 truncate">
        {label}
        {description && <span className="ml-2 text-muted-foreground">{description}</span>}
      </span>
      {trailing ?? (active && <IconArrowRight aria-hidden size={15} className="shrink-0 text-muted-foreground" />)}
    </button>
  );
}

export function BentoCommandPalette({
  open,
  onOpenChange,
  items,
  group,
  onQueryChange,
}: Readonly<BentoCommandPaletteProps>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const navResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const labelled = items.map((item) => ({
      item,
      label: t(item.titleKey),
      description: t(item.descriptionKey),
    }));
    if (!q) return labelled;

    // Title matches first, then description matches. A reader who half-remembers
    // a name should not scroll past entries that merely mention it; a reader who
    // only remembers what a surface does should still find it. Matching titles
    // alone sent that second reader back to the nav they opened this to avoid.
    const byTitle = [];
    const byDescription = [];
    for (const entry of labelled) {
      if (entry.label.toLowerCase().includes(q)) byTitle.push(entry);
      else if (entry.description.toLowerCase().includes(q)) byDescription.push(entry);
    }
    return [...byTitle, ...byDescription];
  }, [items, query, t]);

  /**
   * One flat list across both groups, because the arrow keys and
   * `aria-activedescendant` are one cursor. The supplied group comes second and
   * arrives in the order the product gave it — nothing here sorts it.
   */
  const rows = useMemo(
    () => [
      ...navResults.map((entry) => ({ kind: "nav" as const, entry })),
      ...(group?.items ?? []).map((item) => ({ kind: "supplied" as const, item })),
    ],
    [navResults, group],
  );

  /**
   * Report the query without making the parent's callback a dependency.
   *
   * The obvious spelling — an effect on `[query, onQueryChange]` — loops for any
   * consumer that passes an inline arrow and sets state from it, which is every
   * consumer this prop exists for: the new arrow re-runs the effect, which asks
   * again. The ref holds the latest callback and the effect watches the query
   * alone, which is the thing that actually changed.
   */
  const report = useRef(onQueryChange);
  useEffect(() => {
    report.current = onQueryChange;
  });
  useEffect(() => {
    report.current?.(query);
  }, [query]);

  // Reset transient state whenever the palette (re)opens, and keep the active
  // row within bounds as the filtered list shrinks.
  //
  // Adjusted during render rather than in effects: an effect renders the stale
  // query once before clearing it, so reopening the palette flashes the last
  // search — and the bounds pass would paint a highlight on a row that is no
  // longer there.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActiveIndex(0);
    }
  }

  const maxIndex = rows.length === 0 ? 0 : rows.length - 1;
  if (activeIndex > maxIndex) setActiveIndex(maxIndex);

  // Scroll the active row into view on keyboard navigation.
  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function choose(row: (typeof rows)[number]) {
    onOpenChange(false);
    if (row.kind === "nav") navigate(bentoNavTarget(row.entry.item));
    else group?.onSelect(row.item);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (rows.length === 0 ? 0 : (prev + 1) % rows.length));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (rows.length === 0 ? 0 : (prev - 1 + rows.length) % rows.length));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const hit = rows[activeIndex];
      if (hit) choose(hit);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0"
        onKeyDown={onKeyDown}
      >
        <DialogTitle className="sr-only">{t("bento.palette.title", { defaultValue: "Command palette" })}</DialogTitle>
        <DialogDescription className="sr-only">
          {t("bento.palette.description", { defaultValue: "Search and jump to any area" })}
        </DialogDescription>

        <div className="flex items-center gap-3 border-b border-border/60 px-4">
          <IconSearch size={18} className="shrink-0 text-muted-foreground" />
          {/* autoFocus is deliberate: a palette is a keyboard-first launcher, and a
              reader who pressed the shortcut is already typing. */}
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="bento-palette-list"
            aria-activedescendant={rows[activeIndex] ? `bento-palette-opt-${activeIndex}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bento.palette.placeholder", { defaultValue: "Search areas…" })}
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div
          ref={listRef}
          id="bento-palette-list"
          role="listbox"
          aria-label={t("bento.palette.title", { defaultValue: "Command palette" })}
          className="max-h-80 overflow-y-auto p-2"
        >
          {/* Nothing at all, and nothing still on its way. A pending group has
              its own line below, inside the group that is resolving. */}
          {rows.length === 0 && !group?.pending && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("bento.palette.noResults", { defaultValue: "No matches" })}
            </p>
          )}

          {/* Headed only when there are two groups: with the nav group alone
              there is nothing to tell apart, and a heading over the whole list
              is a label the listbox already carries. */}
          <Section
            label={group && navResults.length > 0 ? t("bento.palette.areas", { defaultValue: "Areas" }) : undefined}
          >
            {navResults.map(({ item, label }, index) => (
              <Option
                key={item.id}
                index={index}
                active={index === activeIndex}
                icon={item.icon}
                label={label}
                onActivate={() => setActiveIndex(index)}
                onChoose={() => choose(rows[index])}
                trailing={
                  item.bentoRoute ? undefined : (
                    <>
                      <IconExternalLink aria-hidden size={15} className="shrink-0 text-muted-foreground/70" />
                      <span className="sr-only">
                        {t("bento.palette.opensConsole", { defaultValue: "Opens in console" })}
                      </span>
                    </>
                  )
                }
              />
            ))}
          </Section>

          {group && (
            <Section label={group.label}>
              {group.items.map((item, offset) => {
                const index = navResults.length + offset;
                return (
                  <Option
                    key={item.id}
                    index={index}
                    active={index === activeIndex}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    onActivate={() => setActiveIndex(index)}
                    onChoose={() => choose(rows[index])}
                  />
                );
              })}
              {group.pending && (
                <p className="px-3 py-2.5 text-sm text-muted-foreground">
                  {t("bento.palette.searching", { defaultValue: "Searching…" })}
                </p>
              )}
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
