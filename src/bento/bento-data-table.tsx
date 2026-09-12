import {
  createCoreRowModel,
  createSortedRowModel,
  rowSortingFeature,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { IconArrowDown, IconArrowUp, IconArrowsSort, IconColumns3 } from "@tabler/icons-react";
import {
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { BentoActionsMenu, type BentoActionTone } from "./bento-actions-menu";

export interface BentoDataTableColumn<TRow> {
  /** Stable id, also what a layout's `hidden` list names. */
  id: string;
  /** The header, in the product's words, already translated. */
  header: string;
  /** What the cell shows. */
  cell: (row: TRow) => ReactNode;
  /** Given, the column sorts by this value; omitted, its header is not a sort control. */
  sortValue?: (row: TRow) => string | number | Date | null | undefined;
  /** The column's grid track, e.g. `"minmax(16rem, 2fr)"`. Defaults to `minmax(8rem, 1fr)`. */
  width?: string;
  /** `false` keeps the column out of the column picker, always shown. */
  hideable?: boolean;
}

export interface BentoDataTableAction<TRow> {
  /** Stable id for the action. */
  id: string;
  /** What the menu or the selection bar says, already translated. */
  label: string;
  icon: ComponentType<{ size?: number }>;
  tone?: BentoActionTone;
  /** Receives the one row, or every selected row. */
  onSelect: (rows: TRow[]) => void;
}

/** Which columns the reader hid. The product stores it; the table only reports changes. */
export interface BentoDataTableLayout {
  hidden: string[];
}

export interface BentoDataTableProps<TRow> {
  rows: readonly TRow[];
  getRowId: (row: TRow) => string;
  columns: readonly BentoDataTableColumn<TRow>[];
  /** The table's accessible name. */
  label: string;
  /** How a screen reader names one row, in its checkbox and its actions menu. Defaults to its id. */
  getRowLabel?: (row: TRow) => string;
  /** A menu of named actions on each row. */
  rowActions?: readonly BentoDataTableAction<TRow>[];
  /** Given, rows are selectable, and these act on the selection from a bar above the table. */
  selectionActions?: readonly BentoDataTableAction<TRow>[];
  onSelectionChange?: (ids: string[]) => void;
  /**
   * What the rows were chosen by, such as a serialised filter. A selection holds
   * within one scope, and a new one starts with nothing selected, so an action
   * never lands on rows a filter has since hidden.
   */
  selectionScope?: string;
  /** Controlled column layout. Omitted, the table keeps its own. */
  layout?: BentoDataTableLayout;
  onLayoutChange?: (layout: BentoDataTableLayout) => void;
  /** Enter or a double click on a row. */
  onRowOpen?: (row: TRow) => void;
  /** Pixels per row. Rows are one height, which is what lets the table mount only the visible ones. */
  rowHeight?: number;
  /** The scrolling body's height in pixels. */
  height?: number;
  /** Shown instead of the body when there are no rows. */
  empty?: ReactNode;
}

/** Rows mounted beyond each edge of the window, so a fast scroll does not show blank space. */
const OVERSCAN = 6;

const features = {
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
};

/**
 * VDS138 — a table a curator sorts, range-selects and acts on at scale.
 *
 * `BentoListPage` renders tiles, which fits a dozen sites and not a folder of four
 * thousand posts, so every console hand-rolled its lists, each with its own idea
 * of sorting, selection and keyboard, and none with virtualization. This is the
 * one table: rows are mounted only for the visible window, sortable headers say
 * how they sort, a row is reachable, selectable and actionable from the keyboard
 * (arrows, shift-arrows for a range, Space, Enter, Escape), and row actions are a
 * menu of named items, never hover-only buttons.
 *
 * It holds no data and no product vocabulary: the product passes rows, columns
 * and actions, and stores the column layout the way `BentoListPage` has it store
 * a tile layout.
 */
export function BentoDataTable<TRow extends RowData>({
  rows,
  getRowId,
  columns,
  label,
  getRowLabel,
  rowActions,
  selectionActions,
  onSelectionChange,
  selectionScope,
  layout,
  onLayoutChange,
  onRowOpen,
  rowHeight = 44,
  height = 480,
  empty,
}: Readonly<BentoDataTableProps<TRow>>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [ownLayout, setOwnLayout] = useState<BentoDataTableLayout>({ hidden: [] });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [anchor, setAnchor] = useState<number | null>(null);
  const [scope, setScope] = useState(selectionScope);

  // VDS139 — a new scope clears the selection in the same render that shows the
  // new rows, so no frame offers an action on the old ones.
  if (scope !== selectionScope) {
    setScope(selectionScope);
    setSelected(new Set());
    setAnchor(null);
  }

  // The product hears about it after the render, since telling a parent to update
  // while this table renders is an update React refuses.
  const lastScope = useRef(selectionScope);
  useEffect(() => {
    if (lastScope.current === selectionScope) return;
    lastScope.current = selectionScope;
    onSelectionChange?.([]);
  }, [selectionScope, onSelectionChange]);
  const [focused, setFocused] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const body = useRef<HTMLDivElement>(null);
  const rowElements = useRef(new Map<number, HTMLDivElement>());
  const focusAfterRender = useRef(false);

  const selectable = (selectionActions?.length ?? 0) > 0;
  const nameOf = (row: TRow) => getRowLabel?.(row) ?? getRowId(row);

  const tableColumns = useMemo<ColumnDef<typeof features, TRow>[]>(
    () =>
      columns.map((column) => ({
        id: column.id,
        accessorFn: (row: TRow) => column.sortValue?.(row) ?? null,
        enableSorting: column.sortValue !== undefined,
      })),
    [columns],
  );

  const table = useTable({
    features,
    data: rows as TRow[],
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
  });
  // The table widens its rows to RowData; they are the product's rows, sorted.
  const ordered = table.getRowModel().rows.map((row) => row.original as TRow);

  const currentLayout = layout ?? ownLayout;
  const visible = columns.filter((c) => c.hideable === false || !currentLayout.hidden.includes(c.id));
  const tracks = [
    selectable ? "2.75rem" : null,
    ...visible.map((c) => c.width ?? "minmax(8rem, 1fr)"),
    rowActions?.length ? "3.25rem" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const total = ordered.length;
  const page = Math.max(1, Math.floor(height / rowHeight));
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
  const last = Math.min(total, Math.ceil((scrollTop + height) / rowHeight) + OVERSCAN);
  const current = Math.min(focused, Math.max(0, total - 1));

  // Focus follows the keyboard into rows the move just scrolled into view. Only
  // after a key moved it: mounting or a click never takes focus from the page.
  useEffect(() => {
    if (!focusAfterRender.current) return;
    focusAfterRender.current = false;
    rowElements.current.get(current)?.focus();
  }, [current, first]);

  function select(next: ReadonlySet<string>) {
    setSelected(next);
    onSelectionChange?.([...next]);
  }

  function selectRange(from: number, to: number) {
    const [low, high] = from <= to ? [from, to] : [to, from];
    select(new Set(ordered.slice(low, high + 1).map(getRowId)));
  }

  function toggle(index: number) {
    const id = getRowId(ordered[index]);
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    select(next);
    setAnchor(index);
  }

  function moveTo(index: number, extend: boolean) {
    const target = Math.max(0, Math.min(total - 1, index));
    if (extend && selectable) {
      const from = anchor ?? current;
      setAnchor(from);
      selectRange(from, target);
    }
    // Scroll first, so the row is in the window the next render mounts.
    const el = body.current;
    const top = target * rowHeight;
    if (el) {
      let nextTop = el.scrollTop;
      if (top < nextTop) nextTop = top;
      else if (top + rowHeight > nextTop + height) nextTop = top + rowHeight - height;
      if (nextTop !== el.scrollTop) {
        el.scrollTop = nextTop;
        setScrollTop(nextTop);
      }
    }
    focusAfterRender.current = true;
    setFocused(target);
  }

  function onRowKeyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    // Keys inside a row's checkbox or menu belong to those controls.
    if (event.target !== event.currentTarget) return;
    const extend = event.shiftKey;
    switch (event.key) {
      case "ArrowDown":
        moveTo(index + 1, extend);
        break;
      case "ArrowUp":
        moveTo(index - 1, extend);
        break;
      case "PageDown":
        moveTo(index + page, extend);
        break;
      case "PageUp":
        moveTo(index - page, extend);
        break;
      case "Home":
        moveTo(0, extend);
        break;
      case "End":
        moveTo(total - 1, extend);
        break;
      case " ":
        if (!selectable) return;
        toggle(index);
        break;
      case "Enter":
        if (!onRowOpen) return;
        onRowOpen(ordered[index]);
        break;
      case "Escape":
        if (!selectable || selected.size === 0) return;
        select(new Set());
        setAnchor(null);
        break;
      case "a":
      case "A":
        if (!selectable || !(event.ctrlKey || event.metaKey)) return;
        select(new Set(ordered.map(getRowId)));
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function onRowClick(event: MouseEvent<HTMLDivElement>, index: number) {
    if ((event.target as HTMLElement).closest("button, a, input, [role='checkbox']")) return;
    setFocused(index);
    if (!selectable) return;
    if (event.shiftKey) {
      const from = anchor ?? current;
      setAnchor(from);
      selectRange(from, index);
    } else if (event.metaKey || event.ctrlKey) {
      toggle(index);
    } else {
      select(new Set([getRowId(ordered[index])]));
      setAnchor(index);
    }
  }

  function toggleSort(id: string) {
    const now = sorting.find((s) => s.id === id);
    if (!now) setSorting([{ id, desc: false }]);
    else if (!now.desc) setSorting([{ id, desc: true }]);
    else setSorting([]);
  }

  function setHidden(id: string, hidden: boolean) {
    const next = {
      hidden: hidden ? [...currentLayout.hidden, id] : currentLayout.hidden.filter((h) => h !== id),
    };
    if (layout === undefined) setOwnLayout(next);
    onLayoutChange?.(next);
  }

  const selectedRows = ordered.filter((row) => selected.has(getRowId(row)));
  const allSelected = total > 0 && selectedRows.length === total;
  const hideable = columns.filter((c) => c.hideable !== false);

  return (
    <div data-slot="bento-data-table" className="bento-glass overflow-hidden rounded-2xl">
      <div className="flex min-h-12 flex-wrap items-center gap-2 border-b border-border/50 px-3 py-2">
        {/* Present before anything is selected, so the first count is announced. */}
        <span aria-live="polite" className="text-sm font-medium">
          {selectedRows.length > 0
            ? t("bento.table.selected", { defaultValue: "{{count}} selected", count: selectedRows.length })
            : ""}
        </span>
        {selectedRows.length > 0 && (
          <div role="toolbar" aria-label={t("bento.table.selectionActions", { defaultValue: "Actions on the selection" })} className="flex flex-wrap items-center gap-2">
            {selectionActions?.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  className={cn("gap-1.5", action.tone === "destructive" && "bento-item-danger")}
                  onClick={() => action.onSelect(selectedRows)}
                >
                  <Icon size={16} />
                  {action.label}
                </Button>
              );
            })}
            <Button variant="ghost" size="sm" onClick={() => select(new Set())}>
              {t("bento.table.clearSelection", { defaultValue: "Clear selection" })}
            </Button>
          </div>
        )}
        {hideable.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-auto gap-1.5">
                <IconColumns3 size={16} aria-hidden="true" />
                {t("bento.table.columns", { defaultValue: "Columns" })}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bento-dropdown min-w-44 p-1.5">
              {hideable.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={!currentLayout.hidden.includes(column.id)}
                  onCheckedChange={(checked) => setHidden(column.id, checked !== true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div
        role="grid"
        aria-label={label}
        aria-rowcount={total + 1}
        aria-colcount={visible.length + (selectable ? 1 : 0) + (rowActions?.length ? 1 : 0)}
        aria-multiselectable={selectable ? "true" : undefined}
      >
        <div role="rowgroup">
          <div
            role="row"
            aria-rowindex={1}
            className="grid items-center border-b border-border/50 px-1 text-xs font-medium text-muted-foreground"
            style={{ gridTemplateColumns: tracks, minHeight: rowHeight }}
          >
            {selectable && (
              <div role="columnheader" className="grid place-items-center">
                <Checkbox
                  aria-label={t("bento.table.selectAll", { defaultValue: "Select all rows" })}
                  checked={allSelected ? true : selectedRows.length > 0 ? "indeterminate" : false}
                  onCheckedChange={() => select(allSelected ? new Set() : new Set(ordered.map(getRowId)))}
                />
              </div>
            )}
            {visible.map((column) => {
              const sort = sorting.find((s) => s.id === column.id);
              const state = sort ? (sort.desc ? "descending" : "ascending") : "none";
              return (
                <div
                  key={column.id}
                  role="columnheader"
                  aria-sort={column.sortValue ? state : undefined}
                  className="min-w-0 px-2"
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(column.id)}
                      className="inline-flex max-w-full items-center gap-1 rounded-md py-1 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="truncate">{column.header}</span>
                      {state === "ascending" && <IconArrowUp size={14} aria-hidden="true" />}
                      {state === "descending" && <IconArrowDown size={14} aria-hidden="true" />}
                      {state === "none" && <IconArrowsSort size={14} aria-hidden="true" className="opacity-40" />}
                    </button>
                  ) : (
                    <span className="block truncate py-1">{column.header}</span>
                  )}
                </div>
              );
            })}
            {rowActions?.length ? (
              <div role="columnheader" className="px-2">
                <span className="sr-only">{t("bento.table.actions", { defaultValue: "Actions" })}</span>
              </div>
            ) : null}
          </div>
        </div>

        {total === 0 ? (
          <div role="rowgroup">
            <div role="row" aria-rowindex={2}>
              <div role="gridcell" className="px-4 py-10 text-center text-sm text-muted-foreground">
                {empty ?? t("bento.table.empty", { defaultValue: "Nothing to show" })}
              </div>
            </div>
          </div>
        ) : (
          <div
            role="rowgroup"
            ref={body}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            className="relative overflow-y-auto"
            style={{ height }}
          >
            <div style={{ height: total * rowHeight }} className="relative">
              {ordered.slice(first, last).map((row, offset) => {
                const index = first + offset;
                const id = getRowId(row);
                const isSelected = selected.has(id);
                const name = nameOf(row);
                return (
                  <div
                    key={id}
                    ref={(el) => {
                      if (el) rowElements.current.set(index, el);
                      else rowElements.current.delete(index);
                    }}
                    role="row"
                    aria-rowindex={index + 2}
                    aria-selected={selectable ? (isSelected ? "true" : "false") : undefined}
                    tabIndex={index === current ? 0 : -1}
                    onKeyDown={(event) => onRowKeyDown(event, index)}
                    onClick={(event) => onRowClick(event, index)}
                    onDoubleClick={() => onRowOpen?.(row)}
                    onFocus={(event) => {
                      if (event.target === event.currentTarget) setFocused(index);
                    }}
                    className={cn(
                      "absolute inset-x-0 grid items-center border-b border-border/30 px-1 text-sm outline-none transition-colors",
                      "hover:bg-muted/40 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      isSelected && "bg-primary/10 hover:bg-primary/15",
                    )}
                    style={{ top: index * rowHeight, height: rowHeight, gridTemplateColumns: tracks }}
                  >
                    {selectable && (
                      <div role="gridcell" className="grid place-items-center">
                        <Checkbox
                          tabIndex={-1}
                          aria-label={t("bento.table.selectRow", { defaultValue: "Select {{row}}", row: name })}
                          checked={isSelected}
                          onCheckedChange={() => toggle(index)}
                        />
                      </div>
                    )}
                    {visible.map((column) => (
                      <div key={column.id} role="gridcell" className="min-w-0 truncate px-2">
                        {column.cell(row)}
                      </div>
                    ))}
                    {rowActions?.length ? (
                      <div role="gridcell" className="grid place-items-center">
                        <BentoActionsMenu
                          triggerLabel={t("bento.table.rowActions", { defaultValue: "Actions for {{row}}", row: name })}
                          actions={rowActions.map((action) => ({
                            label: action.label,
                            icon: action.icon,
                            tone: action.tone,
                            onSelect: () => action.onSelect([row]),
                          }))}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
