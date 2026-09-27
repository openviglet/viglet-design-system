import { IconChevronRight } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { BentoChangeMark, type BentoChangeState } from "./bento-change-mark";

/** How a field's two values are compared. */
export type BentoDiffFieldKind =
  /** Plain text, compared word by word. */
  | "text"
  /** HTML, compared on the blocks it renders (paragraphs, headings, items), not on its markup. */
  | "rich"
  /** A source file, compared line by line and drawn numbered, as a review tool reads one. */
  | "lines"
  /** Anything else, compared whole: a number, a date, a choice. */
  | "value";

export interface BentoDiffField {
  id: string;
  /** The field's name, already translated. */
  label: string;
  kind?: BentoDiffFieldKind;
  /** How a `value` field shows one side. Defaults to its string form. */
  format?: (value: unknown) => ReactNode;
}

/** One side of a comparison, by field id. `null` is a side that does not exist: a created or deleted item. */
export type BentoDiffSide = Readonly<Record<string, unknown>> | null;

export interface BentoDiffProps {
  before: BentoDiffSide;
  after: BentoDiffSide;
  fields: readonly BentoDiffField[];
  /** Open the unchanged fields instead of collapsing them. */
  showUnchanged?: boolean;
  /**
   * How a `lines` field is drawn: one column, or the original beside the change
   * with unchanged lines level. Other kinds have no rows to align and ignore it.
   * Split falls back to inline where the comparison is narrower than 48rem.
   */
  layout?: BentoDiffLayout;
}

export type BentoDiffLayout = "inline" | "split";

type Part = { op: "same" | "add" | "remove"; text: string };

/** The longest common subsequence of two token lists, as parts, or null past the size it is worth computing. */
function diffTokens(before: readonly string[], after: readonly string[], merge = true): Part[] | null {
  const n = before.length;
  const m = after.length;
  if (n * m > 400_000) return null;
  const lengths = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lengths[i][j] = before[i] === after[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }
  const parts: Part[] = [];
  const push = (op: Part["op"], text: string) => {
    const last = parts[parts.length - 1];
    // Words run together into one span; blocks stay one paragraph each.
    if (merge && last?.op === op) last.text += text;
    else parts.push({ op, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (before[i] === after[j]) {
      push("same", before[i]);
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push("remove", before[i++]);
    } else {
      push("add", after[j++]);
    }
  }
  while (i < n) push("remove", before[i++]);
  while (j < m) push("add", after[j++]);
  return parts;
}

const words = (text: string) => text.split(/(\s+)/).filter((token) => token !== "");

/** The text of each block an HTML value renders, so a change of markup alone is no change. */
function renderedBlocks(html: string): string[] {
  if (typeof DOMParser === "undefined") {
    return html
      .split(/<\/(?:p|h[1-6]|li|blockquote|pre|div)>/i)
      .map((block) => block.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [...doc.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre")]
    // A block inside another block is read as part of it.
    .filter((el) => !el.parentElement?.closest("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre"))
    .map((el) => (el.textContent ?? "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const loose = (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
  return blocks.length > 0 ? blocks : loose ? [loose] : [];
}

const asText = (value: unknown) => (value === null || value === undefined ? "" : String(value));

type FieldState = BentoChangeState;

/**
 * VDS140 — one comparison for every place a curator compares two versions.
 *
 * Revision history, an agent's change under review and a translation against its
 * source each put two versions of structured content side by side. Drawn per
 * surface, the three would disagree about what changed and how a change reads.
 *
 * Field by field, from a schema the product passes: unchanged fields collapse, text
 * is compared by word, rich text by the blocks it renders, and a side that does not
 * exist, a page just created or just deleted, renders whole as additions or
 * removals rather than as an empty panel. A change is named in text as well as
 * coloured, so it reads the same without colour. It fetches nothing.
 */
export function BentoDiff({ before, after, fields, showUnchanged = false, layout = "inline" }: Readonly<BentoDiffProps>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(showUnchanged);

  const rows = fields.map((field) => {
    const a = before?.[field.id];
    const b = after?.[field.id];
    const kind = field.kind ?? "text";
    const same =
      kind === "rich"
        ? renderedBlocks(asText(a)).join("\n") === renderedBlocks(asText(b)).join("\n")
        : kind === "value"
          ? JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
          : asText(a) === asText(b);
    let state: FieldState = "changed";
    if (before === null || ((a === undefined || a === null || a === "") && !same)) state = "added";
    else if (after === null || ((b === undefined || b === null || b === "") && !same)) state = "removed";
    else if (same) state = "unchanged";
    return { field, a, b, kind, state };
  });

  const changed = rows.filter((row) => row.state !== "unchanged");
  const unchanged = rows.filter((row) => row.state === "unchanged");

  return (
    <div data-slot="bento-diff" className="flex flex-col gap-3">
      {(before === null || after === null) && (
        <p className="m-0 text-sm font-medium">
          {before === null
            ? t("bento.diff.created", { defaultValue: "Created in this version" })
            : t("bento.diff.deleted", { defaultValue: "Deleted in this version" })}
        </p>
      )}

      {changed.length === 0 && (
        <p className="m-0 text-sm text-muted-foreground">
          {t("bento.diff.noChanges", { defaultValue: "No field changed" })}
        </p>
      )}

      <dl className="m-0 flex flex-col gap-3">
        {changed.map((row) => (
          <FieldRow key={row.field.id} label={row.field.label} state={row.state}>
            <FieldChange row={row} layout={layout} />
          </FieldRow>
        ))}
      </dl>

      {unchanged.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            aria-expanded={open ? "true" : "false"}
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1 self-start rounded-md text-sm text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <IconChevronRight size={14} aria-hidden="true" className={cn("transition-transform", open && "rotate-90")} />
            {t("bento.diff.unchangedCount", { defaultValue: "{{count}} unchanged", count: unchanged.length })}
          </button>
          {open && (
            <dl className="m-0 flex flex-col gap-3">
              {unchanged.map((row) => (
                <FieldRow key={row.field.id} label={row.field.label} state="unchanged">
                  <p className={cn("m-0 whitespace-pre-wrap text-sm text-muted-foreground", row.kind === "lines" && "font-mono text-xs")}>
                    {row.kind === "rich"
                      ? renderedBlocks(asText(row.b)).join("\n\n")
                      : row.field.format
                        ? row.field.format(row.b)
                        : asText(row.b)}
                  </p>
                </FieldRow>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, state, children }: Readonly<{ label: string; state: FieldState; children: ReactNode }>) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <dt className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <BentoChangeMark state={state} />
      </dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function FieldChange({
  row,
  layout,
}: Readonly<{
  row: { field: BentoDiffField; a: unknown; b: unknown; kind: BentoDiffFieldKind; state: FieldState };
  layout: BentoDiffLayout;
}>) {
  const { t } = useTranslation();
  const { field, a, b, kind, state } = row;

  if (kind === "lines") return <LinesChange label={field.label} before={asText(a)} after={asText(b)} layout={layout} />;

  if (kind === "value") {
    const show = (value: unknown) => (field.format ? field.format(value) : asText(value));
    return (
      <p className="m-0 flex flex-wrap items-center gap-2 text-sm">
        {state !== "added" && <Removed>{show(a)}</Removed>}
        {state === "changed" && <span aria-hidden="true">→</span>}
        {state !== "removed" && <Added>{show(b)}</Added>}
      </p>
    );
  }

  const blocksBefore = kind === "rich" ? renderedBlocks(asText(a)) : [asText(a)].filter(Boolean);
  const blocksAfter = kind === "rich" ? renderedBlocks(asText(b)) : [asText(b)].filter(Boolean);

  // Blocks are matched first, so a paragraph added between two others is one
  // added block, and a paragraph edited is a word diff inside it.
  const blockParts = diffTokens(blocksBefore, blocksAfter, false) ?? [
    ...blocksBefore.map((text) => ({ op: "remove" as const, text })),
    ...blocksAfter.map((text) => ({ op: "add" as const, text })),
  ];

  const paragraphs: ReactNode[] = [];
  for (let i = 0; i < blockParts.length; i++) {
    const part = blockParts[i];
    const next = blockParts[i + 1];
    if (part.op === "remove" && next?.op === "add") {
      const inner = diffTokens(words(part.text), words(next.text));
      paragraphs.push(
        <p key={i} className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
          {inner
            ? inner.map((p, k) =>
                p.op === "same" ? <span key={k}>{p.text}</span> : p.op === "add" ? <Added key={k}>{p.text}</Added> : <Removed key={k}>{p.text}</Removed>,
              )
            : [<Removed key="r">{part.text}</Removed>, " ", <Added key="a">{next.text}</Added>]}
        </p>,
      );
      i++;
    } else {
      paragraphs.push(
        <p key={i} className="m-0 whitespace-pre-wrap text-sm leading-relaxed">
          {part.op === "same" ? part.text : part.op === "add" ? <Added>{part.text}</Added> : <Removed>{part.text}</Removed>}
        </p>,
      );
    }
  }

  if (paragraphs.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">{t("bento.diff.empty", { defaultValue: "Empty" })}</p>;
  }
  return <div className="flex flex-col gap-2">{paragraphs}</div>;
}

type LineRow = {
  op: Part["op"];
  text: string;
  /** The line's number in the old file, absent on an added line. */
  old?: number;
  /** The line's number in the new file, absent on a removed line. */
  new?: number;
  /** Where an edited line is paired with its other side: what changed inside it. */
  parts?: Part[];
};

/** Unchanged lines kept around each change; the rest fold. */
const CONTEXT = 3;

/** A file's lines. One trailing line break ends the last line rather than opening an empty one. */
const splitLines = (text: string) => (text === "" ? [] : text.replace(/\r?\n$/, "").split(/\r?\n/));

/**
 * The rows of a line comparison, or null past the size it is worth computing.
 *
 * The common head and tail are trimmed before the lines are compared, so the
 * ceiling bounds the changed middle and not the file: one edit in a long file is a
 * few cells. Within a change, removed lines come first and each is paired in
 * order with an added one, compared word by word.
 */
function lineRows(before: string, after: string): LineRow[] | null {
  const a = splitLines(before);
  const b = splitLines(after);
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++;

  const middle = diffTokens(a.slice(head, a.length - tail), b.slice(head, b.length - tail), false);
  if (middle === null) return null;

  const rows: LineRow[] = [];
  let oldNo = 0;
  let newNo = 0;
  const same = (text: string) => rows.push({ op: "same", text, old: ++oldNo, new: ++newNo });
  a.slice(0, head).forEach(same);

  let removed: LineRow[] = [];
  let added: LineRow[] = [];
  const flush = () => {
    for (let k = 0; k < Math.min(removed.length, added.length); k++) {
      const inner = diffTokens(words(removed[k].text), words(added[k].text));
      if (inner) {
        removed[k].parts = inner.filter((part) => part.op !== "add");
        added[k].parts = inner.filter((part) => part.op !== "remove");
      }
    }
    rows.push(...removed, ...added);
    removed = [];
    added = [];
  };
  for (const part of middle) {
    if (part.op === "remove") removed.push({ op: "remove", text: part.text, old: ++oldNo });
    else if (part.op === "add") added.push({ op: "add", text: part.text, new: ++newNo });
    else {
      flush();
      same(part.text);
    }
  }
  flush();

  a.slice(a.length - tail).forEach(same);
  return rows;
}

/** One row of the split layout. `null` is the hatched cell left where the other side of a change runs longer. */
type SplitRow = { left: LineRow | null; right: LineRow | null };

/** The rows paired into two columns: each change's removed lines beside its added ones, in order. */
function splitRows(rows: readonly LineRow[]): SplitRow[] {
  const out: SplitRow[] = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].op === "same") {
      out.push({ left: rows[i], right: rows[i] });
      i++;
      continue;
    }
    const removed: LineRow[] = [];
    const added: LineRow[] = [];
    for (; i < rows.length && rows[i].op !== "same"; i++) (rows[i].op === "remove" ? removed : added).push(rows[i]);
    for (let k = 0; k < Math.max(removed.length, added.length); k++) {
      out.push({ left: removed[k] ?? null, right: added[k] ?? null });
    }
  }
  return out;
}

type Segment<T> = { fold: false; items: T[] } | { fold: true; key: string; items: T[] };

/**
 * The rows split into what is shown and the unchanged runs folded away from every
 * change. A fold is keyed by its first line's numbers, so both layouts name the
 * same fold the same way and one opened in either stays open in the other.
 */
function foldLines<T>(items: readonly T[], changed: (item: T) => boolean, key: (item: T) => string): Segment<T>[] {
  const near = new Array<boolean>(items.length).fill(false);
  items.forEach((item, i) => {
    if (!changed(item)) return;
    for (let k = Math.max(0, i - CONTEXT); k <= Math.min(items.length - 1, i + CONTEXT); k++) near[k] = true;
  });
  const segments: Segment<T>[] = [];
  let i = 0;
  while (i < items.length) {
    const start = i;
    const shown = near[i];
    while (i < items.length && near[i] === shown) i++;
    const run = items.slice(start, i);
    // A fold of one line takes the room the line would.
    if (shown || run.length === 1) segments.push({ fold: false, items: run });
    else segments.push({ fold: true, key: key(run[0]), items: run });
  }
  return segments;
}

/**
 * VDS168 — a source file compared by line, drawn as a file is read: numbered
 * monospace rows, a sign in text beside the tint, and the unchanged stretch
 * between two changes folded behind a count. The field scrolls sideways rather
 * than the page, and takes focus so a keyboard can scroll it. No highlighting: a
 * grammar per language is a parser the package would own for everyone.
 *
 * VDS169 — split draws the original beside the change, aligned by row rather than
 * by scrolling: lines wrap, so a row is as tall as its longer cell and two columns
 * never need scrollbars kept in step. Under 48rem of the comparison's own width
 * (a container query, since a sheet is narrower than the window) it draws inline,
 * as two columns of a few words each read worse than one.
 */
function LinesChange({
  label,
  before,
  after,
  layout,
}: Readonly<{ label: string; before: string; after: string; layout: BentoDiffLayout }>) {
  const { t } = useTranslation();
  const [unfolded, setUnfolded] = useState<ReadonlySet<string>>(new Set());
  const rows = lineRows(before, after);

  if (rows === null) {
    return (
      <p className="m-0 text-sm text-muted-foreground">
        {t("bento.diff.tooLarge", { defaultValue: "Too many lines changed to compare them here" })}
      </p>
    );
  }
  if (rows.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">{t("bento.diff.empty", { defaultValue: "Empty" })}</p>;
  }

  const toggle = (key: string) => {
    const next = new Set(unfolded);
    if (!next.delete(key)) next.add(key);
    setUnfolded(next);
  };

  /** A folded run, drawn as a row spanning the table, then its lines where it is open. */
  function fold<T>(segment: Segment<T> & { fold: true }, span: number, draw: (item: T) => ReactNode): ReactNode[] {
    const open = unfolded.has(segment.key);
    return [
      <tr key={`fold-${segment.key}`}>
        <td colSpan={span} className="bg-muted/40 px-2">
          <button
            type="button"
            aria-expanded={open ? "true" : "false"}
            onClick={() => toggle(segment.key)}
            className="inline-flex items-center gap-1 rounded-md font-sans text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <IconChevronRight size={12} aria-hidden="true" className={cn("transition-transform", open && "rotate-90")} />
            {t("bento.diff.unchangedLines", { defaultValue: "{{count}} unchanged lines", count: segment.items.length })}
          </button>
        </td>
      </tr>,
      ...(open ? segment.items.map(draw) : []),
    ];
  }

  const inline = (className?: string) => (
    <table data-layout="inline" className={cn("min-w-full border-collapse font-mono text-xs leading-5", className)}>
      <tbody>
        {foldLines(rows, (row) => row.op !== "same", rowKey).map((segment) => {
          const draw = (row: LineRow) => <LineRowView key={rowKey(row)} row={row} />;
          return segment.fold ? fold(segment, 4, draw) : segment.items.map(draw);
        })}
      </tbody>
    </table>
  );

  const split = (className: string) => (
    <table data-layout="split" className={cn("w-full table-fixed border-collapse font-mono text-xs leading-5", className)}>
      <colgroup>
        <col className="w-14" />
        <col className="w-5" />
        <col />
        <col className="w-14" />
        <col className="w-5" />
        <col />
      </colgroup>
      <tbody>
        {foldLines(splitRows(rows), (pair) => pair.left?.op !== "same", splitKey).map((segment) => {
          const draw = (pair: SplitRow) => <SplitRowView key={splitKey(pair)} pair={pair} />;
          return segment.fold ? fold(segment, 6, draw) : segment.items.map(draw);
        })}
      </tbody>
    </table>
  );

  return (
    <section
      aria-label={label}
      // A scroll container is reached by Tab so a keyboard can scroll it sideways.
      tabIndex={0}
      className="@container/diff overflow-x-auto rounded-md border border-border/60 focus-visible:outline-2 focus-visible:outline-ring"
    >
      {layout === "split" ? (
        <>
          {inline("@3xl/diff:hidden")}
          {split("hidden @3xl/diff:table")}
        </>
      ) : (
        inline()
      )}
    </section>
  );
}

const rowKey = (row: LineRow) => `${row.old ?? ""}:${row.new ?? ""}`;
const splitKey = (pair: SplitRow) => `${pair.left?.old ?? ""}:${pair.right?.new ?? ""}`;

const tintOf = (row: LineRow) =>
  cn(row.op === "add" && "bento-status bento-status-on", row.op === "remove" && "bento-status bento-status-error");

/** A line's text, its changed words marked where it is paired with its other side. */
function lineContent(row: LineRow): ReactNode {
  if (row.parts) {
    return row.parts.map((part, k) => {
      if (part.op === "add") return <Added key={k}>{part.text}</Added>;
      if (part.op === "remove") return <Removed key={k}>{part.text}</Removed>;
      return <span key={k}>{part.text}</span>;
    });
  }
  return row.op === "same" ? row.text : <LineMark op={row.op}>{row.text}</LineMark>;
}

const SIGN = { same: " ", add: "+", remove: "−" } as const;
const NUMBER = "select-none px-2 text-right align-top text-muted-foreground tabular-nums";

function LineRowView({ row }: Readonly<{ row: LineRow }>) {
  const tint = tintOf(row);
  return (
    <tr data-op={row.op}>
      <td className={cn("w-px", NUMBER, tint)}>{row.old}</td>
      <td className={cn("w-px", NUMBER, tint)}>{row.new}</td>
      <td aria-hidden="true" className={cn("w-px select-none pr-1", tint)}>
        {SIGN[row.op]}
      </td>
      {/* An edited line tints its changed words and not the line under them: two tints stacked lose contrast. */}
      <td className={cn("whitespace-pre pr-3", !row.parts && tint)}>{lineContent(row)}</td>
    </tr>
  );
}

function SplitRowView({ pair }: Readonly<{ pair: SplitRow }>) {
  return (
    <tr data-op={pair.left?.op === "same" ? "same" : "change"}>
      <SplitSide row={pair.left} number={pair.left?.old} />
      <SplitSide row={pair.right} number={pair.right?.new} right />
    </tr>
  );
}

/** One column of a split row, or the hatched cell standing in for a line the other side added or removed. */
function SplitSide({ row, number, right = false }: Readonly<{ row: LineRow | null; number?: number; right?: boolean }>) {
  if (row === null) {
    return (
      <td
        colSpan={3}
        data-empty=""
        className={cn(
          "[background-image:repeating-linear-gradient(-45deg,var(--color-border)_0_1px,transparent_0_6px)]",
          right && "border-l border-border/60",
        )}
      />
    );
  }
  const tint = tintOf(row);
  return (
    <>
      <td className={cn(NUMBER, tint, right && "border-l border-border/60")}>{number}</td>
      <td aria-hidden="true" className={cn("select-none align-top", tint)}>
        {SIGN[row.op]}
      </td>
      <td className={cn("whitespace-pre-wrap pr-3 [overflow-wrap:anywhere]", !row.parts && tint)}>{lineContent(row)}</td>
    </>
  );
}

/** A whole line added or removed: the row's tint and sign carry it, so only the words said aloud are added here. */
function LineMark({ op, children }: Readonly<{ op: "add" | "remove"; children: ReactNode }>) {
  const { t } = useTranslation();
  const Tag = op === "add" ? "ins" : "del";
  return (
    <Tag className="no-underline">
      <span className="sr-only">
        {op === "add"
          ? t("bento.diff.addedStart", { defaultValue: "added:" })
          : t("bento.diff.removedStart", { defaultValue: "removed:" })}{" "}
      </span>
      {children}
    </Tag>
  );
}

/** Added text: underlined as well as tinted, and said aloud. */
function Added({ children }: Readonly<{ children: ReactNode }>) {
  const { t } = useTranslation();
  return (
    <ins className="bento-status bento-status-on rounded-sm px-0.5 underline decoration-2 underline-offset-2">
      <span className="sr-only">{t("bento.diff.addedStart", { defaultValue: "added:" })} </span>
      {children}
    </ins>
  );
}

/** Removed text: struck through as well as tinted, and said aloud. */
function Removed({ children }: Readonly<{ children: ReactNode }>) {
  const { t } = useTranslation();
  return (
    <del className="bento-status bento-status-error rounded-sm px-0.5 line-through decoration-2">
      <span className="sr-only">{t("bento.diff.removedStart", { defaultValue: "removed:" })} </span>
      {children}
    </del>
  );
}
