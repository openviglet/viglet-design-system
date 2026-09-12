/**
 * VDS113 — a consumer's `className` spliced into a template literal instead of
 * merged through `cn()`.
 *
 * Two defects, one shape. The visible one is a rendered `class="… undefined"`:
 * the prop is optional, `BadgeLocale` interpolated it with no fallback, and the
 * package's own `LanguageSelect` omits it, so that literal shipped in every
 * product. A `?? ""` closes only that half.
 *
 * The half it does not close is the whole reason `cn()` is here. It runs
 * tailwind-merge, which is what makes a consumer's `py-2` *beat* the component's
 * `py-1`; spliced, the override merely follows it into the class attribute and
 * then loses to stylesheet order. `bento-inline-edit` documents its `className`
 * as the prop that keeps the display and edit states typographically identical,
 * which is exactly the case a losing override fails.
 *
 * So the interpolation itself is reported, and only where the interpolated value
 * is the component's own `className` — a template literal assembling a class
 * list out of its own constants is nobody's override and is left alone.
 *
 * The name is followed through one hop of assignment, because that is how it was
 * written: `const sharedClass = ` … ${className}` ` and then `sharedClass` at
 * three use sites. Reporting the declaration alone names the fix once instead of
 * three times.
 */

/** The names a destructuring pattern binds `className` to. */
function classNameBindings(pattern, into) {
  if (!pattern || pattern.type !== "ObjectPattern") return
  for (const property of pattern.properties) {
    if (property.type !== "Property" || property.key.type !== "Identifier") continue
    if (property.key.name !== "className") continue
    const value = property.value
    // `{ className }`, `{ className: cls }` and `{ className = "" }` alike.
    const bound = value.type === "AssignmentPattern" ? value.left : value
    if (bound.type === "Identifier") into.add(bound.name)
  }
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require a className prop to be merged with cn() rather than interpolated into a template literal",
    },
    schema: [],
    messages: {
      spliced:
        "`{{name}}` is spliced into a class list here, so it cannot win tailwind-merge — an override follows the component's own class instead of replacing it, and an omitted prop renders a literal `undefined`. Build the list with `cn(...)` and pass `{{name}}` last.",
    },
  },

  create(context) {
    /** Every name in this file that holds a `className` prop. */
    const names = new Set()

    /** Whether any expression in this template reads one of those names. */
    function splicedName(template) {
      for (const expression of template.expressions) {
        let found = null
        const seek = (node) => {
          if (found || !node || typeof node.type !== "string") return
          if (node.type === "Identifier" && names.has(node.name)) {
            found = node.name
            return
          }
          for (const key of Object.keys(node)) {
            if (key === "parent") continue
            const value = node[key]
            if (Array.isArray(value)) value.forEach(seek)
            else if (value && typeof value === "object") seek(value)
          }
        }
        seek(expression)
        if (found) return found
      }
      return null
    }

    const templates = []

    return {
      ":function"(node) {
        for (const parameter of node.params) classNameBindings(parameter, names)
      },

      // A class list assembled into a name, which is then used as one: the
      // binding is what carries the splice on to every use site.
      VariableDeclarator(node) {
        if (node.id.type !== "Identifier") return
        if (node.init?.type !== "TemplateLiteral") return
        templates.push(node.init)
      },

      // A descendant rather than a direct child, so `cn(`… ${className}`)` —
      // which merges the pieces it is given and not the ones spliced inside one
      // of them — is caught too. Narrowed to `className`, because interpolating
      // the prop into some other attribute is a different mistake.
      'JSXAttribute[name.name="className"] TemplateLiteral'(node) {
        templates.push(node)
      },

      // Deferred: a component destructures its props at the top, but a helper
      // further down the file binds its own, and both have to be known first.
      "Program:exit"() {
        for (const template of templates) {
          const name = splicedName(template)
          if (name) context.report({ node: template, messageId: "spliced", data: { name } })
        }
      },
    }
  },
}
