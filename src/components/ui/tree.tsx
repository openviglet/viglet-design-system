import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import * as React from "react";

/**
 * One node of a `Tree`: a name, and the nodes under it where it has any.
 *
 * `id` is the node's own segment and has to be unique among its siblings. A node is addressed
 * by the chain of ids from the root, joined with `/`, which is the key `expanded`, `selected`
 * and every callback speak in — so for a tree built from paths the key *is* the path.
 */
export interface TreeNode {
  readonly id: string;
  readonly label: React.ReactNode;
  /** Absent or empty makes it a leaf. An empty array still draws as a leaf, not an empty folder. */
  readonly children?: readonly TreeNode[];
}

/** One row as the tree draws it: what a caller gets back, and what the keyboard moves between. */
interface Row {
  readonly key: string;
  readonly node: TreeNode;
  /** The ids this row stands for — more than one where a single-child run was folded. */
  readonly ids: readonly string[];
  readonly level: number;
  readonly hasChildren: boolean;
}

export interface TreeProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  readonly nodes: readonly TreeNode[];
  /**
   * What the tree is, for a screen reader. Required rather than optional: a `tree` with no
   * name is announced as an unlabelled group, and there is no sensible default for it.
   */
  readonly label: string;
  /** The keys that are open. Given, the tree is controlled; omitted, it keeps its own. */
  readonly expanded?: readonly string[];
  readonly defaultExpanded?: readonly string[];
  readonly onExpandedChange?: (next: readonly string[]) => void;
  /** The key that is current. Drawn as selected and announced as such. */
  readonly selected?: string;
  readonly onSelect?: (key: string, node: TreeNode) => void;
  /** What a row shows after its name — a count, a state, a badge. The product's to decide. */
  readonly renderAfter?: (node: TreeNode, key: string) => React.ReactNode;
  /**
   * Fold a run of folders that never branches into one row, `a/b/c`, the way an editor does.
   * On by default: a project four folders deep is otherwise four rows of indentation before
   * the first name anybody came to read.
   */
  readonly compact?: boolean;
}

const JOIN = "/";

/** The key a node is addressed by, which is the chain of ids from the root. */
function keyOf(parent: string, id: string): string {
  return parent === "" ? id : `${parent}${JOIN}${id}`;
}

function hasChildren(node: TreeNode): boolean {
  return node.children !== undefined && node.children.length > 0;
}

/**
 * Fold a folder whose only child is a folder into it, so `a` holding only `b` holding only `c`
 * is one row. The ids are kept in order, because the row still opens and closes the deepest of
 * them and a caller asking what it stands for gets all three.
 */
function folded(node: TreeNode, ids: readonly string[], on: boolean): { node: TreeNode; ids: readonly string[] } {
  if (!on || !hasChildren(node)) return { node, ids };
  const only = node.children?.length === 1 ? node.children[0] : undefined;
  if (only === undefined || !hasChildren(only)) return { node, ids };
  return folded(only, [...ids, only.id], on);
}

/** Every row the tree is drawing now, in the order the eye reads them and the keyboard moves. */
function rowsOf(
  nodes: readonly TreeNode[],
  open: ReadonlySet<string>,
  compact: boolean,
  parent = "",
  level = 1,
): Row[] {
  const rows: Row[] = [];
  for (const node of nodes) {
    const run = folded(node, [node.id], compact);
    const key = run.ids.reduce<string>((at, id) => keyOf(at, id), parent);
    const branching = hasChildren(run.node);
    rows.push({ key, node: run.node, ids: run.ids, level, hasChildren: branching });
    if (branching && open.has(key)) {
      rows.push(...rowsOf(run.node.children ?? [], open, compact, key, level + 1));
    }
  }
  return rows;
}

/** The label a folded run shows: every id it stands for, joined the way a path is. */
function shownLabel(row: Row): React.ReactNode {
  return row.ids.length > 1 ? row.ids.join(JOIN) : row.node.label;
}

/**
 * A hierarchy of named nodes, drawn the way an editor draws a working tree: folders that open
 * and close, one tab stop, and the arrow keys moving between rows.
 *
 * **It takes nodes and never paths.** Splitting a string into segments is a platform question,
 * and a package that picked a separator would be wrong on the consumer that does not use it.
 * `treeFromPaths` is here for callers whose data really is a list of strings.
 *
 * **What a row says beyond its name is the caller's**, through `renderAfter` — a publish state,
 * a count, a badge. This owns the branching and none of the meaning.
 *
 * Keyboard, as the `tree` pattern asks: up and down move between visible rows, right opens a
 * closed folder and then steps into it, left closes an open one and then steps out to its
 * parent, Home and End reach the ends, and Enter or Space selects.
 *
 * @example
 * <Tree label="Files" nodes={treeFromPaths(["src/app.ts", "src/lib/fs.ts"])} />
 */
export function Tree({
  nodes,
  label,
  expanded,
  defaultExpanded,
  onExpandedChange,
  selected,
  onSelect,
  renderAfter,
  compact = true,
  className,
  ...rest
}: TreeProps) {
  const [ownExpanded, setOwnExpanded] = React.useState<readonly string[]>(defaultExpanded ?? []);
  const open = React.useMemo(
    () => new Set(expanded ?? ownExpanded),
    [expanded, ownExpanded],
  );
  const rows = React.useMemo(() => rowsOf(nodes, open, compact), [nodes, open, compact]);

  // Which row holds the tab stop. A tree is one stop and the arrows move inside it, so this is
  // the key that carries `tabIndex={0}` — never every row, which would make a deep tree a
  // hundred stops on the way to whatever is after it.
  const [at, setAt] = React.useState<string | null>(null);
  const here = rows.some((row) => row.key === at) ? at : (rows[0]?.key ?? null);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const setOpen = React.useCallback(
    (next: readonly string[]) => {
      if (expanded === undefined) setOwnExpanded(next);
      onExpandedChange?.(next);
    },
    [expanded, onExpandedChange],
  );

  const toggle = React.useCallback(
    (key: string, to: boolean) => {
      const was = [...open];
      if (to === open.has(key)) return;
      setOpen(to ? [...was, key] : was.filter((one) => one !== key));
    },
    [open, setOpen],
  );

  /** Move the tab stop and the focus together, so the arrows read as movement and not as a jump. */
  const moveTo = React.useCallback((key: string) => {
    setAt(key);
    const row = boxRef.current?.querySelector<HTMLElement>(`[data-tree-key="${CSS.escape(key)}"]`);
    row?.focus();
  }, []);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const index = rows.findIndex((row) => row.key === here);
      const row = rows[index];
      if (row === undefined) return;
      const step = (to: number) => {
        const next = rows[to];
        if (next !== undefined) moveTo(next.key);
      };

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          step(index + 1);
          return;
        case "ArrowUp":
          event.preventDefault();
          step(index - 1);
          return;
        case "Home":
          event.preventDefault();
          step(0);
          return;
        case "End":
          event.preventDefault();
          step(rows.length - 1);
          return;
        case "ArrowRight":
          event.preventDefault();
          // Open first, then step in: two presses on a closed folder reach its first child,
          // which is what the pattern asks and what a reader expects from an explorer.
          if (row.hasChildren && !open.has(row.key)) toggle(row.key, true);
          else if (row.hasChildren) step(index + 1);
          return;
        case "ArrowLeft": {
          event.preventDefault();
          if (row.hasChildren && open.has(row.key)) {
            toggle(row.key, false);
            return;
          }
          // Out to the parent, found by the row above it that is one level shallower.
          for (let above = index - 1; above >= 0; above -= 1) {
            const one = rows[above];
            if (one !== undefined && one.level < row.level) {
              moveTo(one.key);
              return;
            }
          }
          return;
        }
        case "Enter":
        case " ":
          event.preventDefault();
          if (row.hasChildren) toggle(row.key, !open.has(row.key));
          onSelect?.(row.key, row.node);
          return;
        default:
          return;
      }
    },
    [rows, here, open, toggle, moveTo, onSelect],
  );

  return (
    <div
      ref={boxRef}
      role="tree"
      aria-label={label}
      className={cn("flex flex-col text-sm", className)}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {rows.map((row) => {
        const isOpen = row.hasChildren && open.has(row.key);
        return (
          <div
            key={row.key}
            role="treeitem"
            data-tree-key={row.key}
            aria-level={row.level}
            aria-expanded={row.hasChildren ? isOpen : undefined}
            aria-selected={selected === undefined ? undefined : selected === row.key}
            tabIndex={here === row.key ? 0 : -1}
            className={cn(
              "flex cursor-default items-center gap-1.5 rounded-sm px-1.5 py-1 outline-none",
              "hover:bg-accent focus-visible:ring-ring focus-visible:ring-2",
              selected === row.key && "bg-accent",
            )}
            style={{ paddingInlineStart: `${String(row.level * 0.75)}rem` }}
            onFocus={() => {
              setAt(row.key);
            }}
            onClick={() => {
              if (row.hasChildren) toggle(row.key, !isOpen);
              onSelect?.(row.key, row.node);
            }}
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                row.hasChildren ? "opacity-70" : "opacity-0",
                isOpen && "rotate-90",
              )}
            />
            <span className="min-w-0 truncate">{shownLabel(row)}</span>
            {renderAfter?.(row.node, row.key)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Build `TreeNode`s from a list of paths, for the caller whose data really is a list of strings.
 *
 * The separator is the caller's, because which character divides a path is a question about
 * their platform and their data and not about this package. Paths are grouped in the order
 * they arrive, so a caller that wants them sorted sorts them first.
 *
 * @example
 * treeFromPaths(["src/app.ts", "src/lib/fs.ts", "README.md"])
 */
interface Building {
  id: string;
  label: string;
  children: Building[];
}

export function treeFromPaths(
  paths: readonly string[],
  options: { readonly separator?: string } = {},
): TreeNode[] {
  const separator = options.separator ?? JOIN;
  const roots: Building[] = [];
  // Every folder reached so far, by its path, so the second file under `src` finds the `src`
  // the first one made instead of adding a second beside it.
  const made = new Map<string, Building>();

  for (const path of paths) {
    const segments = path.split(separator).filter((one) => one !== "");
    let list = roots;
    let at = "";
    for (const segment of segments) {
      at = at === "" ? segment : `${at}${separator}${segment}`;
      let found = made.get(at);
      if (found === undefined) {
        // Every node is built able to hold children. A leaf keeps the empty array, which is
        // what `TreeNode` calls a leaf — only a node with something under it is a folder.
        found = { id: segment, label: segment, children: [] };
        made.set(at, found);
        list.push(found);
      }
      list = found.children;
    }
  }

  return roots;
}
