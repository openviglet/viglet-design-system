import { useEffect, useRef } from "react";

/** What a shell shortcut asks for. The product owns the open state; the hook only calls back. */
export type BentoShellAction = "palette" | "shortcuts";

export interface BentoShellShortcut {
  action: BentoShellAction;
  /** The `KeyboardEvent.key` it answers, compared case-insensitively. */
  key: string;
  /**
   * Held with the platform's own modifier: ⌘ on macOS, Ctrl everywhere else,
   * which is the one the hint shows. A chord types no character, so it answers
   * from inside a field too; a bare key never does.
   */
  mod?: boolean;
}

/**
 * VDS149 — the shell's one binding set, read by the hook that binds it, the
 * dialog that lists it and the trigger that hints at it.
 *
 * Each product used to write its own. Two did, and they agreed on ⌘K and nothing
 * else: one bound `?` to the guide, the other bound `/` to the palette and never
 * bound `?`, while mounting the guide that listed `?` as global and did not list
 * `/`. A guide to a dead key, and the real shortcut unlisted.
 *
 * `/` stays. It is the search key readers bring from elsewhere, the product that
 * bound it already taught it, and a bare key costs nothing where nobody is typing,
 * which is the only place a bare key answers.
 */
export const BENTO_SHELL_SHORTCUTS: readonly BentoShellShortcut[] = Object.freeze([
  { action: "palette", key: "k", mod: true },
  { action: "palette", key: "/" },
  { action: "shortcuts", key: "?" },
]);

/** macOS and iPadOS, which is where the modifier is ⌘. */
export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
}

/** The keycaps a binding shows, one per `<kbd>`: `["⌘", "K"]`, `["Ctrl", "K"]`, `["/"]`. */
export function bentoShortcutKeys(shortcut: BentoShellShortcut, isMac: boolean): string[] {
  const key = shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key;
  return shortcut.mod ? [isMac ? "⌘" : "Ctrl", key] : [key];
}

/**
 * Whether a key pressed here was meant for a field: an input, a textarea, a
 * select or anything editable. `closest` rather than `isContentEditable` alone,
 * because a node inside an editor is editable by inheritance and not every DOM
 * implementation computes that.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return true;
  if (target.isContentEditable) return true;
  const editable = target.closest("[contenteditable]");
  return editable !== null && editable.getAttribute("contenteditable") !== "false";
}

/**
 * The binding a keydown answers, if any.
 *
 * Nothing answers a key something nearer already handled, which is how an editor
 * binding ⌘K to "insert link" keeps it, nor one mid-composition or held down. A
 * bare key answers only outside a field and under no modifier, except AltGr,
 * which reports Ctrl and Alt together and is how some layouts type `/` at all.
 */
export function matchShellShortcut(event: KeyboardEvent, isMac: boolean): BentoShellShortcut | undefined {
  if (event.defaultPrevented || event.isComposing || event.repeat) return undefined;
  const key = event.key.toLowerCase();
  return BENTO_SHELL_SHORTCUTS.find((shortcut) => {
    if (key !== shortcut.key) return false;
    if (shortcut.mod) {
      const mod = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
      return mod && !event.altKey && !event.shiftKey;
    }
    if (event.metaKey || isTypingTarget(event.target)) return false;
    return event.ctrlKey === event.altKey;
  });
}

export interface BentoShellShortcutsOptions {
  /** Called for ⌘K or `/`. Toggle here: ⌘K pressed with the palette open is how a reader closes it. */
  onPalette: () => void;
  /** Called for `?`. Omit it and `?` is left alone, for a product that mounts no guide. */
  onShortcuts?: () => void;
  /** Detected from the platform when omitted; pass it to pin one in a test or a story. */
  isMac?: boolean;
}

/**
 * Bind the shell's shortcuts on the window, once, at the shell's root.
 *
 * ```tsx
 * useBentoShellShortcuts({
 *   onPalette: () => setPaletteOpen((open) => !open),
 *   onShortcuts: () => setShortcutsOpen((open) => !open),
 * })
 * ```
 */
export function useBentoShellShortcuts({
  onPalette,
  onShortcuts,
  isMac = isMacPlatform(),
}: Readonly<BentoShellShortcutsOptions>): void {
  // The latest callbacks without re-binding the listener on every render: a
  // product passes inline arrows, and each one is a new function.
  const handlers = useRef({ onPalette, onShortcuts });
  useEffect(() => {
    handlers.current = { onPalette, onShortcuts };
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const hit = matchShellShortcut(event, isMac);
      const handler = hit?.action === "palette" ? handlers.current.onPalette : hit && handlers.current.onShortcuts;
      if (!handler) return;
      event.preventDefault();
      handler();
    }
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, [isMac]);
}
