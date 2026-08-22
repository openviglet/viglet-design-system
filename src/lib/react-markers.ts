import type { ReactElement } from "react"

/**
 * The `displayName` of a child element's component, or `undefined` when the
 * child is a host tag.
 *
 * Several components in this package take configuration as marker children —
 * `GridListNewButton`, `SubPageHeaderAction` — that render nothing and exist to
 * be recognised by name. `child.type` is `string | JSXElementConstructor`, and
 * only the second has a `displayName`, which is why reading it directly needs
 * the narrowing this does once instead of a cast at every call site.
 *
 * Internal: not re-exported from `lib/index.ts`, because a marker protocol is a
 * detail of the components that use it rather than something a product composes
 * against.
 */
export function markerName(child: ReactElement): string | undefined {
  return typeof child.type === "string"
    ? undefined
    : (child.type as { displayName?: string }).displayName
}
