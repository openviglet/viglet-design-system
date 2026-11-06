/**
 * VDS237 — the JSX runtime of the browser build, written over `createElement`.
 *
 * Bundling React's own `react/jsx-runtime` would pin the elements to the React
 * that built them: React 19's runtime stamps each element with a symbol React 18
 * does not recognise, so a page loading React 18 would reject every one. The
 * page's React is the only one that can make its elements, and `createElement`
 * is the call both versions share.
 */
import * as React from "react"

type Props = Record<string, unknown> | null

export const Fragment = React.Fragment

const config = (props: Omit<NonNullable<Props>, "children">, key?: React.Key) =>
  key === undefined ? props : { ...props, key }

/**
 * One child, or a list built at runtime. The list stays in `props`, where React
 * asks each item for a key, as it should of a `.map()`.
 */
export function jsx(type: React.ElementType, props: Props, key?: React.Key) {
  return React.createElement(type, config(props ?? {}, key))
}

/**
 * Children written out in the source. Passed as arguments, which is how
 * `createElement` is told the list is static and needs no keys.
 */
export function jsxs(type: React.ElementType, props: Props, key?: React.Key) {
  const { children, ...rest } = props ?? {}
  const list = Array.isArray(children) ? (children as React.ReactNode[]) : [children as React.ReactNode]
  return React.createElement(type, config(rest, key), ...list)
}

/**
 * The development runtime's one call, for a build run where NODE_ENV is not
 * `production` (a test run is one). The fourth argument says which of the two
 * above it stands for; the rest are source locations.
 */
export function jsxDEV(type: React.ElementType, props: Props, key: React.Key | undefined, isStatic: boolean) {
  return isStatic ? jsxs(type, props, key) : jsx(type, props, key)
}
