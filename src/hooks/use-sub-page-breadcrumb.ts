import { type BreadcrumbItem, useBreadcrumbOptional } from "@/contexts/breadcrumb.context";
import { useEffect, useRef } from "react";

/**
 * Manages breadcrumb items for a sub-page, automatically inserting on mount,
 * updating when items change, and removing on unmount.
 *
 * Accepts:
 * - A string: single static label → `useSubPageBreadcrumb("Settings")`
 * - A BreadcrumbItem: label + optional href → `useSubPageBreadcrumb({ label: "Settings", href: "/..." })`
 * - An array of BreadcrumbItem: multiple levels → `useSubPageBreadcrumb([{ label: "Users", href: "/..." }, { label: "admin" }])`
 * - `undefined`: deferred — items are pushed once the value becomes defined (useful for async data)
 *
 * Items are tracked by object reference, so updating the input replaces them
 * in-place (preserving breadcrumb order even when async data arrives late).
 *
 * No-ops gracefully when no BreadcrumbProvider is mounted above — this lets
 * Module Federation remotes use the hook without assuming the host provides one.
 *
 * @since 2026.1.14
 */
export function useSubPageBreadcrumb(
    items: string | BreadcrumbItem | BreadcrumbItem[] | undefined,
) {
    const ctx = useBreadcrumbOptional();
    const setItems = ctx?.setItems;
    const ownItemsRef = useRef<BreadcrumbItem[]>([]);

    useEffect(() => {
        if (items === undefined || !setItems) return;

        const normalized: BreadcrumbItem[] =
            typeof items === "string"
                ? [{ label: items }]
                : Array.isArray(items)
                    ? items
                    : [items];

        const prev = ownItemsRef.current;

        // Skip if nothing changed
        if (
            prev.length === normalized.length &&
            prev.every((p, i) => p.label === normalized[i].label && p.href === normalized[i].href)
        ) {
            return;
        }

        setItems((breadcrumb) => {
            // Lift our previous run out, so an update becomes a fresh insertion
            // at the position we already hold. One path serves both cases: on
            // mount there is no run to lift and `after` is empty, which appends.
            const start = prev.length > 0 ? breadcrumb.indexOf(prev[0]) : -1;
            const before = start >= 0 ? breadcrumb.slice(0, start) : breadcrumb;
            const after = start >= 0 ? breadcrumb.slice(start + prev.length) : [];

            // Insert only the levels that are not already the crumb just above
            // us. Two components can legitimately name the same level and it
            // should not double; this used to compare the first item and then
            // return the breadcrumb untouched, so a sub-page restating its
            // parent — the hook's own documented two-level example — lost every
            // level behind the repeat.
            //
            // Longest run first, so ["Users", "admin"] arriving where both are
            // already present adds nothing rather than repeating one.
            let skip = 0;
            for (let k = Math.min(normalized.length, before.length); k > 0; k -= 1) {
                const tail = before.slice(before.length - k);
                if (tail.every((crumb, i) => crumb.label === normalized[i].label)) {
                    skip = k;
                    break;
                }
            }

            // Recorded here, not after setItems returns: the updater runs during
            // a later render, so anything assigned outside it still holds the
            // pre-update value when the ref is read. The cleanup finds our items
            // by reference, so a ref naming levels the dedupe declined to insert
            // removes nothing at all and leaks them.
            //
            // The write is a pure function of `breadcrumb`, so re-invoking this
            // updater — StrictMode does — lands on the same value. Reading the
            // live breadcrumb is what forces it inside: sibling levels mounting
            // in one commit would both see a stale ctx.items from out here, and
            // that is exactly the parent-and-child case above.
            const inserted = normalized.slice(skip);
            ownItemsRef.current = inserted;

            if (start < 0 && inserted.length === 0) return breadcrumb;
            return [...before, ...inserted, ...after];
        });
    }, [items, setItems]);

    useEffect(() => {
        return () => {
            const own = ownItemsRef.current;
            if (own.length > 0 && setItems) {
                setItems((breadcrumb) => {
                    const idx = breadcrumb.indexOf(own[0]);
                    if (idx >= 0) {
                        return [...breadcrumb.slice(0, idx), ...breadcrumb.slice(idx + own.length)];
                    }
                    return breadcrumb;
                });
            }
            ownItemsRef.current = [];
        };
    }, [setItems]);
}
