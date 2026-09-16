import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tree, treeFromPaths } from "./tree";

/**
 * VDS167 — the branching and the keyboard, which are what three products were about to
 * hand-roll three ways.
 */

const FILES = ["src/components/ui/tree.tsx", "src/components/ui/button.tsx", "src/lib/utils.ts"];

const rows = () => screen.getAllByRole("treeitem").map((row) => row.textContent ?? "");

describe("treeFromPaths", () => {
  it("groups paths under one node per folder, in the order they arrive", () => {
    const built = treeFromPaths(["a/one.ts", "a/two.ts", "b/three.ts"]);

    expect(built.map((node) => node.id)).toEqual(["a", "b"]);
    expect(built[0]?.children?.map((node) => node.id)).toEqual(["one.ts", "two.ts"]);
  });

  it("takes the separator from the caller, since which one divides a path is theirs", () => {
    const built = treeFromPaths(["a\\one.ts", "a\\two.ts"], { separator: "\\" });

    expect(built.map((node) => node.id)).toEqual(["a"]);
    expect(built[0]?.children).toHaveLength(2);
  });

  it("leaves a file a leaf, so an empty children array is not drawn as a folder", () => {
    render(<Tree label="Files" nodes={treeFromPaths(["one.ts"])} />);

    expect(screen.getByRole("treeitem")).not.toHaveAttribute("aria-expanded");
  });
});

describe("VDS167: the tree a reader moves through", () => {
  it("names itself, levels every row, and says which folders are open", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} defaultExpanded={["src"]} />);

    expect(screen.getByRole("tree", { name: "Files" })).toBeInTheDocument();
    const [first] = screen.getAllByRole("treeitem");
    expect(first).toHaveAttribute("aria-level", "1");
    expect(first).toHaveAttribute("aria-expanded", "true");
  });

  it("is one tab stop however deep it is", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} defaultExpanded={["src"]} />);

    const stops = screen.getAllByRole("treeitem").filter((row) => row.tabIndex === 0);

    expect(stops).toHaveLength(1);
  });

  it("folds a run of single-child folders into one row, and stops when it branches", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} defaultExpanded={["src"]} />);

    // `src` holds `components` and `lib`, so it branches and keeps its own row; under it
    // `components` holds only `ui`, which does branch, so the two fold into one.
    expect(rows()[0]).toContain("src");
    expect(rows().some((row) => row.includes("components/ui"))).toBe(true);
  });

  it("keeps every folder its own row where compact is off", () => {
    render(
      <Tree
        label="Files"
        nodes={treeFromPaths(FILES)}
        compact={false}
        defaultExpanded={["src", "src/components"]}
      />,
    );

    expect(rows().some((row) => row.includes("components/ui"))).toBe(false);
    expect(rows().some((row) => row.trim() === "components")).toBe(true);
  });

  it("opens a closed folder on the right arrow, and steps into it on the next", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} />);
    const [first] = screen.getAllByRole("treeitem");
    if (first === undefined) throw new Error("no rows");
    first.focus();

    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(screen.getAllByRole("treeitem")[0]).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(screen.getAllByRole("treeitem")[0] ?? first, { key: "ArrowRight" });
    expect(screen.getAllByRole("treeitem")[1]).toHaveFocus();
  });

  it("closes an open folder on the left arrow, and steps out to the parent on the next", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} defaultExpanded={["src"]} />);
    const child = screen.getAllByRole("treeitem")[1];
    if (child === undefined) throw new Error("no child row");
    // Both: the DOM focus is what `toHaveFocus` reads, and the event is what moves the tab
    // stop. A bare `.focus()` is not wrapped, so the state behind it has not settled when the
    // key arrives — and the press would then be read against whichever row held the stop.
    child.focus();
    fireEvent.focus(child);

    // A leaf or a closed folder has nothing to close, so the press goes to the parent.
    fireEvent.keyDown(child, { key: "ArrowLeft" });
    expect(screen.getAllByRole("treeitem")[0]).toHaveFocus();

    fireEvent.keyDown(screen.getAllByRole("treeitem")[0] ?? child, { key: "ArrowLeft" });
    expect(screen.getAllByRole("treeitem")[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("moves down, up, and to either end", () => {
    render(<Tree label="Files" nodes={treeFromPaths(FILES)} defaultExpanded={["src"]} />);
    const all = screen.getAllByRole("treeitem");
    const [first] = all;
    if (first === undefined) throw new Error("no rows");
    first.focus();

    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(screen.getAllByRole("treeitem")[1]).toHaveFocus();

    fireEvent.keyDown(screen.getAllByRole("treeitem")[1] ?? first, { key: "ArrowUp" });
    expect(screen.getAllByRole("treeitem")[0]).toHaveFocus();

    fireEvent.keyDown(first, { key: "End" });
    expect(screen.getAllByRole("treeitem").at(-1)).toHaveFocus();
  });

  it("tells the caller which node was chosen, by the key its path makes", () => {
    const chosen = vi.fn();
    render(
      <Tree
        label="Files"
        nodes={treeFromPaths(FILES)}
        defaultExpanded={["src", "src/components/ui"]}
        onSelect={chosen}
      />,
    );

    const leaf = screen.getByText("tree.tsx");
    fireEvent.click(leaf);

    expect(chosen).toHaveBeenCalledWith(
      "src/components/ui/tree.tsx",
      expect.objectContaining({ id: "tree.tsx" }),
    );
  });

  it("is controlled where the caller holds what is open", () => {
    const changed = vi.fn();
    render(
      <Tree label="Files" nodes={treeFromPaths(FILES)} expanded={[]} onExpandedChange={changed} />,
    );

    fireEvent.click(screen.getAllByRole("treeitem")[0] ?? document.body);

    // Told, and not opened: what is drawn stays the caller's until they say otherwise.
    expect(changed).toHaveBeenCalledWith(["src"]);
    expect(screen.getAllByRole("treeitem")[0]).toHaveAttribute("aria-expanded", "false");
  });

  it("draws what the caller puts after a row, and says which row is current", () => {
    render(
      <Tree
        label="Files"
        nodes={treeFromPaths(FILES)}
        defaultExpanded={["src"]}
        selected="src"
        renderAfter={(node) => <span>after {node.id}</span>}
      />,
    );

    const [first] = screen.getAllByRole("treeitem");
    if (first === undefined) throw new Error("no rows");
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(within(first).getByText("after src")).toBeInTheDocument();
  });
});
