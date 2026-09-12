import { RuleTester } from "eslint"
import { describe, it } from "vitest"

import rule from "./merge-class-name.mjs"

// VDS113 — the cases below are the shapes the sweep actually found, and the
// ones next to them that must stay quiet. A rule that also reported a class list
// a component assembles from its own constants would be a rule nobody leaves on:
// most template literals in a class attribute are exactly that.

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe("vds/merge-class-name", () => {
  it("reports a spliced className and leaves the rest alone", () => {
    ruleTester.run("merge-class-name", rule as never, {
      valid: [
        // The fix.
        { code: `function C({ className }) { return <div className={cn("p-1", className)} /> }` },
        // A class list built from the component's own state. Nobody's override.
        {
          code: `function C({ paused }) {
            return <div className={\`ring \${paused ? "" : "ring--on"}\`} />
          }`,
        },
        // Not a class list: interpolating the prop into some other attribute is
        // a different mistake and not this rule's.
        { code: `function C({ className }) { return <div title={\`hi \${className}\`} /> }` },
        // Interpolating a *local* name that merely looks like the prop.
        {
          code: `function C() {
            const className = "p-1"
            return <div className={\`box \${className}\`} />
          }`,
          // The binding here is a local const, not a prop, so nothing is
          // destructured and the rule has no name to watch.
        },
      ],
      invalid: [
        // BadgeLocale: no fallback at all, so the rendered class carried a
        // literal `undefined` wherever the optional prop was omitted.
        {
          code: `function C({ className }) { return <div className={\`p-1 \${className}\`} /> }`,
          errors: [{ messageId: "spliced" }],
        },
        // bento-status-marker: the `?? ""` closes the `undefined` half and
        // leaves the merge undone, which is the half that matters.
        {
          code: `function C({ className }) { return <div className={\`p-1 \${className ?? ""}\`} /> }`,
          errors: [{ messageId: "spliced" }],
        },
        // A default parameter is the same: still spliced, still never merged.
        {
          code: `function C({ className = "" }) { return <div className={\`p-1 \${className}\`} /> }`,
          errors: [{ messageId: "spliced" }],
        },
        // Renamed on the way in.
        {
          code: `function C({ className: cls }) { return <div className={\`p-1 \${cls}\`} /> }`,
          errors: [{ messageId: "spliced" }],
        },
        // bento-inline-edit: assembled into a name first and used three times.
        // Reported once, at the declaration, which is where the fix goes.
        {
          code: `function C({ className }) {
            const shared = \`w-full border-b \${className}\`
            return <input className={shared} />
          }`,
          errors: [{ messageId: "spliced" }],
        },
      ],
    })
  })
})
