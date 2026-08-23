import { RuleTester } from "eslint"
import { describe, it } from "vitest"

import rule from "./set-state-in-effect-via-call.mjs"

// VDS57 — the rule exists because react-hooks/set-state-in-effect stops at one
// level of indirection, so the cases below are the three ways to write one
// defect. The direct form stays upstream's, which is why it is `valid` here: a
// defect reported twice is a rule nobody leaves on.

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe("vds/set-state-in-effect-via-call", () => {
  it("holds every form the probe found", () => {
    ruleTester.run("set-state-in-effect-via-call", rule as never, {
      valid: [
        // Upstream's case. Reported there, not here.
        {
          code: `
            function useInline() {
              const [n, setN] = useState(0)
              useEffect(() => { setN(window.innerWidth) }, [])
              return n
            }`,
        },
        // The listener itself is the correct use of an effect: setN runs on a
        // later resize, not during this commit.
        {
          code: `
            function useListenerOnly() {
              const [n, setN] = useState(0)
              useEffect(() => {
                function update() { setN(window.innerWidth) }
                window.addEventListener("resize", update)
                return () => window.removeEventListener("resize", update)
              }, [])
              return n
            }`,
        },
        // A local that touches no setter.
        {
          code: `
            function useLogging() {
              const [n] = useState(0)
              useEffect(() => {
                function log() { console.info(n) }
                log()
              }, [n])
              return n
            }`,
        },
        // Mutually recursive locals must terminate, and reach no setter.
        {
          code: `
            function useMutual() {
              const [n] = useState(0)
              useEffect(() => {
                function a() { b() }
                function b() { a() }
                a()
              }, [])
              return n
            }`,
        },
      ],

      invalid: [
        // BentoBackToTop, as it was written before VDS56.
        {
          code: `
            function BentoBackToTop() {
              const [visible, setVisible] = useState(false)
              useEffect(() => {
                function update() {
                  setVisible(window.scrollY > 480)
                }
                update()
                window.addEventListener("scroll", update, { passive: true })
                return () => window.removeEventListener("scroll", update)
              }, [])
              return visible
            }`,
          errors: [{ messageId: "viaCall", data: { fn: "update", setter: "setVisible" } }],
        },
        // useDensityFactor, as it was written before VDS56: an arrow, and the
        // setter reached through a second local.
        {
          code: `
            function useDensityFactor() {
              const [factor, setFactor] = useState(1)
              useEffect(() => {
                const compute = () => window.innerWidth < 768 ? 0.5 : 1
                const update = () => setFactor(compute())
                update()
                window.addEventListener("resize", update, { passive: true })
                return () => window.removeEventListener("resize", update)
              }, [])
              return factor
            }`,
          errors: [{ messageId: "viaCall", data: { fn: "update", setter: "setFactor" } }],
        },
        // Reached two locals deep, which is why the walk is transitive.
        {
          code: `
            function useIndirect() {
              const [n, setN] = useState(0)
              useEffect(() => {
                function inner() { setN(1) }
                function outer() { inner() }
                outer()
              }, [])
              return n
            }`,
          errors: [{ messageId: "viaCall", data: { fn: "outer", setter: "setN" } }],
        },
        // The useState written below the effect still counts, which is why the
        // report is deferred to Program:exit.
        {
          code: `
            function useDeclaredLater() {
              useEffect(() => {
                const update = () => setN(1)
                update()
              }, [])
              const [n, setN] = useState(0)
              return n
            }`,
          errors: [{ messageId: "viaCall" }],
        },
      ],
    })
  })
})
