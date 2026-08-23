/**
 * VDS57 — the half of `react-hooks/set-state-in-effect` that rule cannot see.
 *
 * Upstream fires when the `setState` is written in the effect body:
 *
 *   useEffect(() => { setN(window.innerWidth) }, [])        // reported
 *
 * It fires on neither of these, which are the same defect:
 *
 *   useEffect(() => {
 *     function update() { setN(window.innerWidth) }
 *     update()                                              // not reported
 *     window.addEventListener("resize", update)
 *   }, [])
 *
 * And the indirect form is the one anybody writes, because it is what a listener
 * needs: you name the function so you can hand it to `addEventListener` and
 * remove it again. Both components VDS56 fixed were written exactly that way and
 * lint had reported clean on them for as long as they existed.
 *
 * This rule covers the indirection and leaves the direct call to upstream, so
 * one defect is never reported twice.
 *
 * What it deliberately does not report is the listener itself. `setN` running
 * on a later `resize` is the correct use of an effect; it is the *synchronous*
 * call — the one priming state the first render should have had — that costs a
 * second commit and shows the wrong frame first.
 */

const EFFECT_HOOKS = new Set([
  "useEffect",
  "useLayoutEffect",
  "useInsertionEffect",
])

/** `useEffect(...)` and `React.useEffect(...)` alike. */
function calleeName(node) {
  const { callee } = node
  if (callee.type === "Identifier") return callee.name
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    return callee.property.name
  }
  return null
}

/** Depth-first over every child node, without relying on `parent` links. */
function walk(node, visit) {
  if (!node || typeof node.type !== "string") return
  visit(node)
  for (const key of Object.keys(node)) {
    if (key === "parent") continue
    const value = node[key]
    if (Array.isArray(value)) {
      for (const child of value) walk(child, visit)
    } else if (value && typeof value === "object") {
      walk(value, visit)
    }
  }
}

/** Functions declared directly in the effect body, by the name they are called by. */
function localFunctions(statements) {
  const locals = new Map()
  for (const statement of statements) {
    if (statement.type === "FunctionDeclaration" && statement.id) {
      locals.set(statement.id.name, statement)
      continue
    }
    if (statement.type !== "VariableDeclaration") continue
    for (const declarator of statement.declarations) {
      const isFunction =
        declarator.init &&
        (declarator.init.type === "ArrowFunctionExpression" ||
          declarator.init.type === "FunctionExpression")
      if (declarator.id.type === "Identifier" && isFunction) {
        locals.set(declarator.id.name, declarator.init)
      }
    }
  }
  return locals
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow priming state from an effect through a locally declared function, which react-hooks/set-state-in-effect does not see",
    },
    schema: [],
    messages: {
      viaCall:
        "`{{fn}}()` reaches `{{setter}}`, so this effect sets state synchronously and costs a second commit — the first render shows the wrong frame. react-hooks/set-state-in-effect does not see it behind the name. Read the value where it lives (useSyncExternalStore) instead.",
    },
  },

  create(context) {
    /** Every `const [x, setX] = useState(...)` in the file. */
    const setters = new Set()
    const effects = []

    function report(effectBody, setters) {
      const locals = localFunctions(effectBody.body)
      if (locals.size === 0) return

      const resolved = new Map()
      const resolving = new Set()

      /** The setter `name` reaches, directly or through another local, or null. */
      function setterReachedBy(name) {
        if (resolved.has(name)) return resolved.get(name)
        // A pair of mutually recursive locals must not spin here.
        if (resolving.has(name)) return null
        resolving.add(name)

        let found = null
        walk(locals.get(name), (node) => {
          if (found) return
          if (node.type !== "CallExpression") return
          if (node.callee.type !== "Identifier") return
          const called = node.callee.name
          if (setters.has(called)) {
            found = called
            return
          }
          if (locals.has(called)) found = setterReachedBy(called)
        })

        resolving.delete(name)
        resolved.set(name, found)
        return found
      }

      // Only calls made synchronously by the effect itself. A reference handed
      // to addEventListener is not a call and is not reported.
      for (const statement of effectBody.body) {
        if (statement.type !== "ExpressionStatement") continue
        const call = statement.expression
        if (call.type !== "CallExpression" || call.callee.type !== "Identifier") continue

        const fn = call.callee.name
        if (!locals.has(fn)) continue

        const setter = setterReachedBy(fn)
        if (setter) {
          context.report({ node: call, messageId: "viaCall", data: { fn, setter } })
        }
      }
    }

    return {
      VariableDeclarator(node) {
        const isUseState =
          node.init?.type === "CallExpression" && calleeName(node.init) === "useState"
        if (!isUseState || node.id.type !== "ArrayPattern") return

        const setter = node.id.elements[1]
        if (setter?.type === "Identifier") setters.add(setter.name)
      },

      CallExpression(node) {
        if (!EFFECT_HOOKS.has(calleeName(node) ?? "")) return
        const callback = node.arguments[0]
        if (!callback) return
        const isFunction =
          callback.type === "ArrowFunctionExpression" ||
          callback.type === "FunctionExpression"
        if (!isFunction || callback.body.type !== "BlockStatement") return
        effects.push(callback.body)
      },

      // Deferred, so a `useState` written below the effect still counts.
      "Program:exit"() {
        for (const body of effects) report(body, setters)
      },
    }
  },
}
