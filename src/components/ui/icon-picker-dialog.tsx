import { Icon } from "@iconify/react";
import { IconLoader2, IconSearch, IconSparkles, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";

const COLLECTIONS = ["lucide", "tabler", "mdi", "ph", "solar", "heroicons"];
const ICONIFY_PREFIXES = COLLECTIONS.join(",");

async function searchIconify(query: string, limit: number): Promise<string[]> {
  try {
    const res = await fetch(
      `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}&prefixes=${ICONIFY_PREFIXES}`,
    );
    if (res.ok) {
      const data = (await res.json()) as { icons?: string[] };
      return data.icons ?? [];
    }
  } catch {
    /* ignore — an offline search shows the empty state, not an error */
  }
  return [];
}

/** One suggested keyword and the icons that search found for it. */
interface KeywordGroup {
  keyword: string;
  icons: string[];
}

export interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string | null;
  /** Called when an icon is selected. Closes the dialog automatically. */
  onSelect: (icon: string) => void;
  /** Optional clear-icon callback. Renders a "Remove" button when set + an icon is selected. */
  onClear?: () => void;
  /** Title of the entity — context for {@link IconPickerDialogProps.suggestKeywords}. */
  title?: string;
  /** Description of the entity — context for {@link IconPickerDialogProps.suggestKeywords}. */
  description?: string;
  /**
   * Turn the entity's context into search keywords, which the dialog then
   * searches for and groups.
   *
   * Supplied by the product, and absent by default: the suggest button appears
   * only when this and some context are given. This is where a product wires
   * its own model — the package searches Iconify and knows nothing about how
   * keywords were arrived at, which is what keeps one product's AI integration
   * out of every product's chrome.
   */
  suggestKeywords?: (context: {
    title?: string;
    description?: string;
  }) => Promise<string[]>;
}

/**
 * Search Iconify and pick an icon, with an optional suggestion pass.
 *
 * Six collections are searched — lucide, tabler, mdi, ph, solar, heroicons —
 * which is what keeps the result set navigable rather than exhaustive.
 */
export function IconPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
  onClear,
  title,
  description,
  suggestKeywords,
}: Readonly<IconPickerDialogProps>) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [suggesting, setSuggesting] = useState(false);
  const [groups, setGroups] = useState<KeywordGroup[]>([]);
  /**
   * Which search is the current one.
   *
   * The debounce is not this guard: it delays *starting* a search, and once one
   * is in flight the next keystroke starts a second alongside it. Iconify is a
   * third-party API over the open internet, so the slower request finishing last
   * is ordinary — and it used to win, leaving `archive` on screen for a box
   * reading `arrow`. Incremented on the way out, compared on the way back.
   *
   * The suggestion path needs none of this: `suggesting` gates a second run, and
   * this component stays mounted while the dialog closes — only `DialogContent`
   * goes — so that flag holds and two runs cannot overlap.
   */
  const latestSearch = useRef(0);
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null);

  const searchIcons = useCallback(async (q: string) => {
    const request = ++latestSearch.current;
    const current = () => request === latestSearch.current;

    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const icons = await searchIconify(q, 60);
      if (current()) setResults(icons);
    } catch {
      if (current()) setResults([]);
    } finally {
      // The spinner belongs to the newest request too: an older one finishing
      // must not clear it while the current search is still running.
      if (current()) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchIcons(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchIcons]);

  function handleSelect(iconName: string) {
    onSelect(iconName);
    onOpenChange(false);
    setQuery("");
    setResults([]);
    setGroups([]);
    setActiveKeyword(null);
  }

  async function handleSuggest() {
    if (!suggestKeywords || suggesting) return;

    setSuggesting(true);
    setGroups([]);
    setActiveKeyword(null);
    try {
      const keywords = (await suggestKeywords({ title, description }))
        .filter((s) => typeof s === "string" && s.trim())
        .slice(0, 5);
      const resolved: KeywordGroup[] = [];
      for (const keyword of keywords) {
        resolved.push({ keyword: keyword.trim(), icons: await searchIconify(keyword.trim(), 30) });
      }
      setGroups(resolved);
    } catch {
      // A failed suggestion shows the empty state rather than stale results.
      setGroups([]);
    } finally {
      setSuggesting(false);
    }
  }

  const visibleSuggested = activeKeyword
    ? (groups.find((g) => g.keyword === activeKeyword)?.icons ?? [])
    : groups.flatMap((g) => g.icons.slice(0, 3));

  const showSuggestButton = !!suggestKeywords && !!(title?.trim() ?? description?.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("forms.iconPicker.chooseAnIcon", { defaultValue: "Choose an icon" })}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("forms.iconPicker.searchIcons", { defaultValue: "Search icons" })}
              className="pl-9"
              autoFocus
            />
          </div>
          {showSuggestButton && (
            <GradientButton
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSuggest}
              disabled={suggesting}
              className="shrink-0 gap-1.5"
            >
              {suggesting ? <IconLoader2 className="size-4 animate-spin" /> : <IconSparkles className="size-4" />}
              {t("forms.iconPicker.aiSuggest", { defaultValue: "Suggest" })}
            </GradientButton>
          )}
        </div>

        {groups.length > 0 && (
          <div className="rounded-lg border border-[var(--vg-accent-line)] bg-[var(--vg-accent-surface)] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium vg-accent-text">
              <IconSparkles className="size-3.5" />
              {t("forms.iconPicker.aiSuggestions", { defaultValue: "Suggestions" })}
            </div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button
                  key={g.keyword}
                  type="button"
                  onClick={() => setActiveKeyword(activeKeyword === g.keyword ? null : g.keyword)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-all ${
 activeKeyword === g.keyword
                      ? "vg-accent-solid text-white"
                      : "bg-[var(--vg-accent-surface)] text-[var(--vg-accent-fg)] hover:bg-[var(--vg-accent-surface-strong)]"
                  }`}
                >
                  {g.keyword}
                  <span className="ml-1 opacity-60">{g.icons.length}</span>
                </button>
              ))}
            </div>
            <div className="flex max-h-60 flex-wrap gap-2 overflow-y-auto">
              {visibleSuggested.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleSelect(iconName)}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-lg p-2 transition-all hover:bg-[var(--vg-accent-surface)] ${
 value === iconName
 ? "border border-[var(--vg-accent-line)] bg-[var(--vg-accent-surface-strong)] vg-accent-text"
                      : "border border-[var(--vg-accent-line)]"
                  }`}
                  title={iconName}
                >
                  <Icon icon={iconName} className="size-7" />
                  <span className="max-w-[80px] truncate text-center text-[9px] leading-tight text-muted-foreground">
                    {iconName.split(":")[1] ?? iconName}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[400px] min-h-[200px] flex-1 overflow-y-auto">
          {loading && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t("forms.iconPicker.searching", { defaultValue: "Searching…" })}
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {t("forms.iconPicker.noIconsFound", { query, defaultValue: "No icons found for “{{query}}”" })}
            </div>
          )}
          {!loading && !query && results.length === 0 && groups.length === 0 && (
            <div className="flex h-32 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
              <span>
                {t("forms.iconPicker.typeToSearch", {
                  count: COLLECTIONS.length,
                  defaultValue: "Type to search {{count}} icon collections",
                })}
              </span>
              {showSuggestButton && (
                <span className="text-xs leading-relaxed">
                  {t("forms.iconPicker.orClickAi", {
                    defaultValue: "…or let the title and description suggest some",
                  })}
                </span>
              )}
            </div>
          )}
          {results.length > 0 && (
            <div className="grid grid-cols-6 gap-1.5 p-1">
              {results.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleSelect(iconName)}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg p-2 transition-all hover:bg-muted ${
 value === iconName
 ? "border border-[var(--vg-accent-line)] bg-[var(--vg-accent-surface)] vg-accent-text"
                      : "border border-transparent hover:border-border"
                  }`}
                  title={iconName}
                >
                  <Icon icon={iconName} className="size-6" />
                  <span className="w-full truncate text-center text-[9px] leading-tight text-muted-foreground">
                    {iconName.split(":")[1] ?? iconName}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {value && (
          <div className="flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-2">
              <Icon icon={value} className="size-5" />
              <span className="font-mono text-xs text-muted-foreground">{value}</span>
            </div>
            <div className="flex gap-2">
              {onClear && (
                <GradientButton
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onClear();
                    onOpenChange(false);
                  }}
                >
                  <IconTrash className="size-4" />
                  {t("forms.common.remove", { defaultValue: "Remove" })}
                </GradientButton>
              )}
              <GradientButton size="sm" type="button" onClick={() => onOpenChange(false)}>
                {t("forms.iconPicker.done", { defaultValue: "Done" })}
              </GradientButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
