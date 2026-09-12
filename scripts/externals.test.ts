import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  EXACT_EXTERNALS,
  EXTERNAL_PATTERNS,
  PEER_EXTERNALS,
  PREFIX_EXTERNALS,
  isExternal,
} from "./lib/externals.mjs"

const root = resolve(import.meta.dirname, "..")

/**
 * VDS43 — one list, two readers.
 *
 * `vite.config.ts` decides what the published bundle leaves out;
 * `check-size.mjs` decides what the size fixture leaves out. They were separate
 * lists and they disagreed — four entries against twenty-four — so `xlsx` was
 * counted as 467 KB of this package's weight while not being in `dist` at all.
 * Beyond the wrong number, a 2% drift now fails `pnpm run build`, so a bump to
 * any externalised package would have failed a build for a reason unrelated to
 * the change.
 *
 * The list is shared now. What is left to guard is that it stays shared: a
 * restated list is exactly what this replaced.
 */
describe("the externals are declared once", () => {
  it("is what the library build uses, not a copy of it", () => {
    const config = readFileSync(join(root, "vite.config.ts"), "utf8")

    expect(config, "vite.config.ts no longer reads the shared list").toContain(
      "externals.mjs",
    )
    expect(config).toContain("external: isExternal")

    // The regression is a list growing back inside the config. Every entry
    // there would be a string in an array beside `external`.
    const inlineList = /external:\s*\[/.exec(config)
    expect(inlineList, "vite.config.ts restates the externals inline again").toBeNull()
  })

  it("is what the size fixture uses too", () => {
    const check = readFileSync(join(root, "scripts", "check-size.mjs"), "utf8")
    expect(check).toContain("externals.mjs")
    expect(check).toContain("external: EXTERNAL_PATTERNS")
  })

  it("externalises the packages the config used to name", () => {
    // Not a restatement: these are the ones whose absence caused the wrong
    // number, plus the peers. If one is dropped deliberately, this line is
    // where the decision gets made rather than noticed.
    for (const id of ["react", "react-dom", "xlsx", "axios", "i18next", "vaul"]) {
      expect(isExternal(id), `${id} is no longer external`).toBe(true)
    }
  })

  it("externalises a subpath of a prefixed package", () => {
    // The reason this is a module and not an array of strings: neither of
    // these is spelled anywhere.
    expect(isExternal("@radix-ui/react-select")).toBe(true)
    expect(isExternal("date-fns/locale/pt-BR")).toBe(true)
    expect(isExternal("@dnd-kit/sortable")).toBe(true)
  })

  it("bundles what a consumer should not have to declare", () => {
    // lucide-react is used internally and is not a consumer's dependency.
    expect(isExternal("lucide-react")).toBe(false)
    expect(isExternal("@/components/ui/button")).toBe(false)
    expect(isExternal("./relative")).toBe(false)
    // A package that merely starts with an external's name is not external.
    expect(isExternal("xlsx-populate")).toBe(false)
    expect(isExternal("react-tooltip")).toBe(false)
  })

  it("offers the same set as Rollup patterns", () => {
    const strings = EXTERNAL_PATTERNS.filter((p) => typeof p === "string")
    const regexes = EXTERNAL_PATTERNS.filter((p) => p instanceof RegExp)

    expect(strings).toEqual([...PEER_EXTERNALS, ...EXACT_EXTERNALS])
    expect(regexes).toHaveLength(PREFIX_EXTERNALS.length)
    // Each regex matches what the predicate matches, or the two forms disagree
    // and the fixture externalises a different set from the build.
    for (const id of ["@radix-ui/react-select", "date-fns/locale/pt-BR", "@dnd-kit/core"]) {
      expect(regexes.some((r) => r.test(id)), `no pattern matches ${id}`).toBe(true)
    }
  })

  /**
   * VDS77 — the list is named for peers, so the manifest has to agree with it.
   *
   * `react-hook-form` sat in `PEER_EXTERNALS` while `package.json` declared it a
   * plain `dependency`. The build left it for the consumer to supply and the
   * manifest promised this package would bring it, and nothing here or anywhere
   * else noticed the two saying opposite things. It matters for this one more
   * than for the rest of the list: `components/ui/form.tsx` re-exports
   * `FormProvider`, `useFormContext` and `useFormState` straight from it, so a
   * second copy in a consumer's tree is a second React context and
   * `useFormContext` returns null where a form was expected.
   *
   * `EXACT_EXTERNALS` is the other arrangement and stays as it is: those are
   * declared dependencies a consumer receives transitively and tree-shakes
   * against its own usage. Nothing there carries a context, so a duplicate costs
   * bytes rather than correctness.
   */
  describe("the peer externals are what the manifest calls peers", () => {
    const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      dependencies: Record<string, string>
      peerDependencies: Record<string, string>
      devDependencies: Record<string, string>
    }

    /** `react/jsx-runtime` is React's, and `vite` is what the ./vite entry runs inside. */
    const rootOf = (id: string) => (id.startsWith("@") ? id.split("/").slice(0, 2).join("/") : id.split("/")[0])

    it.each(PEER_EXTERNALS.filter((id) => id !== "vite"))("%s is declared a peer", (id) => {
      expect(
        manifest.peerDependencies,
        `${id} is externalised as a peer but the manifest does not ask the consumer for it`,
      ).toHaveProperty(rootOf(id))
    })

    it("declares none of them a dependency, which is the contradiction", () => {
      const bothWays = PEER_EXTERNALS.filter((id) => rootOf(id) in manifest.dependencies)
      expect(
        bothWays,
        "these are left for the consumer to supply and promised by this package at the same time",
      ).toEqual([])
    })

    it("installs the one that carries a context, so its own tests see one copy", () => {
      // Not asserted of every peer: `react` and `react-dom` are declared nowhere
      // here and arrive through pnpm's peer auto-install, which is the
      // arrangement this repository already runs on. This one is named because
      // the suite renders forms against it and a duplicate would be the very
      // defect VDS77 removed.
      expect(
        manifest.devDependencies,
        "react-hook-form is a peer this repository does not install for itself",
      ).toHaveProperty("react-hook-form")
    })
  })

  it("records what the fixture measures — this package, not its dependencies", () => {
    // The number that made the defect visible: root-only was 327,757 bytes
    // gzipped while counting xlsx and the Radix tree. If it climbs back past
    // the fonts entry, the fixture has stopped externalising again.
    const baseline = JSON.parse(readFileSync(join(root, "size-budget.json"), "utf8"))
    expect(baseline["root-only"].gzip).toBeLessThan(baseline.fonts.gzip)
  })
})
