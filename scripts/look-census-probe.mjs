// VDS180 — the look census's in-page probe. It runs inside the consumer's page
// through page.evaluate, so it is self-contained: nothing outside the function is
// in scope there. It lives apart from look-census.mjs, which imports node builtins,
// so a browser test can load it (VDS190).

export function probe() {
  const fiberKey = (el) => Object.keys(el).find((k) => k.startsWith("__reactFiber$"))
  const stacks = []
  const stackIndex = new Map()
  const chains = []
  const chainIndex = new Map()
  const FRAME = /\(?((?:https?|file):\/\/[^\s)]+?):(\d+):(\d+)\)?\s*$/

  const stackOf = (fiber) => {
    const text = fiber?._debugStack?.stack
    if (typeof text !== "string") return null
    if (!stackIndex.has(text)) {
      const frames = []
      for (const line of text.split("\n").slice(1)) {
        const m = FRAME.exec(line)
        if (m) frames.push({ url: m[1], line: Number(m[2]), column: Number(m[3]) })
        if (frames.length >= 4) break
      }
      stackIndex.set(text, stacks.length)
      stacks.push(frames)
    }
    return stackIndex.get(text)
  }
  const chainOf = (el) => {
    const key = fiberKey(el)
    let fiber = key ? el[key] : null
    const chain = []
    for (let depth = 0; fiber && depth < 12; depth++) {
      const index = stackOf(fiber)
      if (index === null) break
      chain.push(index)
      fiber = fiber._debugOwner
    }
    const id = chain.join(",")
    if (!chainIndex.has(id)) {
      chainIndex.set(id, chains.length)
      chains.push(chain)
    }
    return chainIndex.get(id)
  }

  // VDS190 — an ancestor at opacity 0 hides an element as surely as its own
  // opacity does: the save bar's morph copy waits that way until the hero leaves.
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    if (r.width <= 0 || r.height <= 0) return false
    if (typeof el.checkVisibility === "function") {
      return el.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    }
    const s = getComputedStyle(el)
    return s.visibility !== "hidden" && s.opacity !== "0"
  }

  // Colours normalised through a canvas, since a computed oklch() is not rgb().
  const canvas = document.createElement("canvas")
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  const rgba = (color) => {
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = "#000"
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    return [...ctx.getImageData(0, 0, 1, 1).data]
  }
  const hex = ([r, g, b]) => `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
  const saturated = ([r, g, b, a]) => {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    return a >= 230 && max >= 60 && (max - min) / max >= 0.35
  }
  const tokenProbe = document.createElement("div")
  tokenProbe.style.background = "var(--primary)"
  document.body.appendChild(tokenProbe)
  const primaryColor = getComputedStyle(tokenProbe).backgroundColor
  tokenProbe.remove()
  const primary = primaryColor ? hex(rgba(primaryColor)) : null

  const samples = []
  const add = (figure, value, el) => samples.push([figure, String(value), chainOf(el)])

  // A switch, checkbox or toggle is filled to state its value, not to claim the page's action.
  const STATEFUL =
    '[role="switch"], [role="checkbox"], [role="radio"], [role="menuitemcheckbox"], [role="menuitemradio"], [aria-checked], [aria-pressed]'
  const buttons = [...document.querySelectorAll('button, [role="button"]')].filter(visible)
  // VDS202 — a button taller than the touch step is a card (a file tile, a
  // marketplace entry, a row with a description): its content sets its height,
  // so it is counted apart and not as a control drawn off the scale.
  tokenProbe.style.height = "var(--vg-control-touch, 2.75rem)"
  document.body.appendChild(tokenProbe)
  const touch = tokenProbe.getBoundingClientRect().height || 44
  tokenProbe.remove()
  let primaries = 0
  let cards = 0
  for (const b of buttons) {
    const height = Math.round(b.getBoundingClientRect().height)
    // VDS201 — a button drawn as text (an inline edit's value, a sort header, a
    // fold) takes its line's height, so it declares itself and is not a control.
    if (height > touch) cards++
    else if (!b.matches('[data-look="text"]')) add("button-height", height, b)
    if (b.matches(STATEFUL)) continue
    const fill = rgba(getComputedStyle(b).backgroundColor)
    if (saturated(fill)) add("primary-fill", hex(fill), b)
    if (fill[3] >= 230 && hex(fill) === primary) primaries++
  }
  const INPUTS =
    'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]):not([type=color]), select'
  for (const i of [...document.querySelectorAll(INPUTS)].filter(visible)) {
    add("input-height", Math.round(i.getBoundingClientRect().height), i)
  }

  const MONO = /mono|courier|consolas|menlo|monaco/i
  const family = (stack) => stack.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""))
  // VDS203 — a stack up to its first generic family: past it nothing is drawn
  // that the generic would not, so a library's appended fallbacks are one face.
  const GENERIC = /^(?:ui-)?monospace$/i
  const face = (stack) => {
    const end = stack.findIndex((f) => GENERIC.test(f))
    return end < 0 ? stack : stack.slice(0, end + 1)
  }
  let seen = 0
  for (const el of document.querySelectorAll("body *")) {
    if (seen++ > 6000) break
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    if (s.borderRadius && s.borderRadius !== "0px") add("radius", s.borderRadius, el)
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim() !== "")
    if (text) {
      const stack = family(s.fontFamily)
      add("font", stack[0], el)
      if (MONO.test(s.fontFamily)) add("mono", face(stack).join(", "), el)
    }
  }

  const title = [...document.querySelectorAll("h1")].find(visible)
  if (title) add("title-x", Math.round(title.getBoundingClientRect().left), title)
  else samples.push(["title-x", "none", -1])

  // VDS133 gave the corner one owner; an interactive element under it is still
  // covered. VDS185 moved the dock to its own slot (the rail's foot, or the header
  // on a phone), so both slots are read.
  // VDS190 — only a slot fixed over the page covers a control. The header's dock
  // rides a sticky bar, and what overlaps it has scrolled under the bar. And the
  // slot covers with what it shows: its box still spans the back-to-top control
  // while that waits at opacity 0.
  const overlaps = []
  for (const slot of document.querySelectorAll('[data-slot="bento-shell-corner"], [data-slot="bento-shell-dock"]')) {
    if (!visible(slot) || getComputedStyle(slot).position !== "fixed") continue
    const covers = [...slot.children].filter(visible).map((child) => child.getBoundingClientRect())
    for (const el of document.querySelectorAll('a[href], button, input, select, textarea, [role="button"]')) {
      if (slot.contains(el) || !visible(el)) continue
      const r = el.getBoundingClientRect()
      const covered = covers.some((c) => {
        const w = Math.min(r.right, c.right) - Math.max(r.left, c.left)
        const h = Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top)
        return w > 4 && h > 4
      })
      if (covered) overlaps.push(chainOf(el))
    }
  }

  // The router's own table: a data router's `routes`, and `<Route>` elements under
  // whichever `<Routes>` rendered, joined to the match above them. The deepest match
  // is the pattern of this page, which is what names a route without its ids.
  const patterns = new Set()
  let current = null
  const joinPath = (base, path) => {
    if (!path) return base || "/"
    if (path.startsWith("/")) return path
    return `${base.replace(/\/\*$/, "").replace(/\/+$/, "")}/${path}`
  }
  const FRAGMENT = Symbol.for("react.fragment")
  const fromObjects = (routes, base) => {
    for (const route of routes ?? []) {
      const path = route.index ? base : joinPath(base, route.path ?? "")
      if (route.index || route.path) patterns.add(path)
      fromObjects(route.children, route.path ? path : base)
    }
  }
  const fromElements = (children, base) => {
    for (const child of [children].flat(Infinity)) {
      const props = child?.props
      if (!props) continue
      if (child.type?.name === "Route") {
        const path = props.index ? base : joinPath(base, props.path ?? "")
        if (props.index || props.path) patterns.add(path)
        fromElements(props.children, props.path ? path : base)
      } else if (child.type === FRAGMENT) {
        fromElements(props.children, base)
      }
    }
  }
  const container = document.querySelector("#root, [data-reactroot]") ?? document.body.firstElementChild
  const rootKey = container && Object.keys(container).find((k) => k.startsWith("__reactContainer$"))
  const walk = [[rootKey ? container[rootKey] : null, ""]]
  for (let visited = 0; walk.length > 0 && visited < 30000; visited++) {
    const [fiber, base] = walk.pop()
    if (!fiber) continue
    const props = fiber.memoizedProps
    let inner = base
    if (props?.router?.routes) fromObjects(props.router.routes, "")
    const matches = props?.value?.matches
    if (Array.isArray(matches) && matches.length > 0 && props.value.outlet !== undefined) {
      const last = matches[matches.length - 1]
      inner = last.pathnameBase ?? base
      const pattern = matches.reduce((acc, m) => joinPath(acc, m.route?.path ?? ""), "")
      if (!current || pattern.length > current.length) current = pattern
    }
    if (props?.children && typeof fiber.type !== "string") fromElements(props.children, inner)
    walk.push([fiber.sibling, base], [fiber.child, inner])
  }

  // VDS187 — the lists drawn as tiles. The marker is newer than some consumers'
  // installs, so every .bento-grid is sent too, to tell "none" from "not marked".
  const tileLists = document.querySelectorAll('[data-slot="bento-list-tiles"]').length
  const mosaics = [...document.querySelectorAll(".bento-grid")].filter(visible).map(chainOf)

  return {
    path: location.pathname,
    dark: document.documentElement.classList.contains("dark"),
    samples,
    primaries,
    cards,
    overlaps,
    tileLists,
    mosaics,
    stacks,
    chains,
    links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
    patterns: [...patterns],
    current,
  }
}
