import { IconChevronRight } from "@tabler/icons-react";
import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
}

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

type FieldState = "added" | "removed" | "changed" | "unchanged";

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
export function BentoDiff({ before, after, fields, showUnchanged = false }: Readonly<BentoDiffProps>) {
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

  const statusText: Record<FieldState, string> = {
    added: t("bento.diff.added", { defaultValue: "Added" }),
    removed: t("bento.diff.removed", { defaultValue: "Removed" }),
    changed: t("bento.diff.changed", { defaultValue: "Changed" }),
    unchanged: t("bento.diff.unchanged", { defaultValue: "Unchanged" }),
  };

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
          <FieldRow key={row.field.id} label={row.field.label} status={statusText[row.state]} state={row.state}>
            <FieldChange row={row} />
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
                <FieldRow key={row.field.id} label={row.field.label} status={statusText.unchanged} state="unchanged">
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

function FieldRow({
  label,
  status,
  state,
  children,
}: Readonly<{ label: string; status: string; state: FieldState; children: ReactNode }>) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <dt className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        <span
          className={cn(
            "rounded-full border px-1.5 leading-4",
            state === "added" && "bento-status bento-status-on",
            state === "removed" && "bento-status bento-status-error",
            state === "changed" && "bento-status bento-status-warn",
          )}
        >
          {status}
        </span>
      </dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function FieldChange({
  row,
}: Readonly<{ row: { field: BentoDiffField; a: unknown; b: unknown; kind: BentoDiffFieldKind; state: FieldState } }>) {
  const { t } = useTranslation();
  const { field, a, b, kind, state } = row;

  if (kind === "lines") return <LinesChange label={field.label} before={asText(a)} after={asText(b)} />;

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

type LineSegment = { fold: false; rows: LineRow[] } | { fold: true; at: number; rows: LineRow[] };

/** The rows split into what is shown and the unchanged runs folded away from every change. */
function foldLines(rows: readonly LineRow[]): LineSegment[] {
  const near = new Array<boolean>(rows.length).fill(false);
  rows.forEach((row, i) => {
    if (row.op === "same") return;
    for (let k = Math.max(0, i - CONTEXT); k <= Math.min(rows.length - 1, i + CONTEXT); k++) near[k] = true;
  });
  const segments: LineSegment[] = [];
  let i = 0;
  while (i < rows.length) {
    const start = i;
    const shown = near[i];
    while (i < rows.length && near[i] === shown) i++;
    const run = rows.slice(start, i);
    // A fold of one line takes the room the line would.
    if (shown || run.length === 1) segments.push({ fold: false, rows: run });
    else segments.push({ fold: true, at: start, rows: run });
  }
  return segments;
}

/**
 * VDS168 — a source file compared by line, drawn as a file is read: numbered
 * monospace rows, a sign in text beside the tint, and the unchanged stretch
 * between two changes folded behind a count. The field scrolls sideways rather
 * than the page, and takes focus so a keyboard can scroll it. No highlighting: a
 * grammar per language is a parser the package would own for everyone.
 */
function LinesChange({ label, before, after }: Readonly<{ label: string; before: string; after: string }>) {
  const { t } = useTranslation();
  const [unfolded, setUnfolded] = useState<ReadonlySet<number>>(new Set());
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

  const toggle = (at: number) => {
    const next = new Set(unfolded);
    if (!next.delete(at)) next.add(at);
    setUnfolded(next);
  };

  return (
    <section
      aria-label={label}
      // A scroll container is reached by Tab so a keyboard can scroll it sideways.
      tabIndex={0}
      className="overflow-x-auto rounded-md border border-border/60 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <table className="min-w-full border-collapse font-mono text-xs leading-5">
        <tbody>
          {foldLines(rows).map((segment) => {
            if (!segment.fold) return segment.rows.map((row) => <LineRowView key={rowKey(row)} row={row} />);
            const open = unfolded.has(segment.at);
            return [
              <tr key={`fold-${segment.at}`}>
                <td colSpan={4} className="bg-muted/40 px-2">
                  <button
                    type="button"
                    aria-expanded={open ? "true" : "false"}
                    onClick={() => toggle(segment.at)}
                    className="inline-flex items-center gap-1 rounded-md font-sans text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <IconChevronRight size={12} aria-hidden="true" className={cn("transition-transform", open && "rotate-90")} />
                    {t("bento.diff.unchangedLines", { defaultValue: "{{count}} unchanged lines", count: segment.rows.length })}
                  </button>
                </td>
              </tr>,
              ...(open ? segment.rows.map((row) => <LineRowView key={rowKey(row)} row={row} />) : []),
            ];
          })}
        </tbody>
      </table>
    </section>
  );
}

const rowKey = (row: LineRow) => `${row.old ?? ""}:${row.new ?? ""}`;

function LineRowView({ row }: Readonly<{ row: LineRow }>) {
  const sign = { same: " ", add: "+", remove: "−" }[row.op];
  let content: ReactNode = row.text;
  if (row.parts) {
    content = row.parts.map((part, k) => {
      if (part.op === "add") return <Added key={k}>{part.text}</Added>;
      if (part.op === "remove") return <Removed key={k}>{part.text}</Removed>;
      return <span key={k}>{part.text}</span>;
    });
  } else if (row.op !== "same") {
    content = <LineMark op={row.op}>{row.text}</LineMark>;
  }
  const tint = cn(row.op === "add" && "bento-status bento-status-on", row.op === "remove" && "bento-status bento-status-error");
  return (
    <tr data-op={row.op}>
      <td className={cn("w-px select-none px-2 text-right text-muted-foreground tabular-nums", tint)}>{row.old}</td>
      <td className={cn("w-px select-none px-2 text-right text-muted-foreground tabular-nums", tint)}>{row.new}</td>
      <td aria-hidden="true" className={cn("w-px select-none pr-1", tint)}>
        {sign}
      </td>
      {/* An edited line tints its changed words and not the line under them: two tints stacked lose contrast. */}
      <td className={cn("whitespace-pre pr-3", !row.parts && tint)}>{content}</td>
    </tr>
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
