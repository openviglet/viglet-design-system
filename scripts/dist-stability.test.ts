import { describe, expect, it } from "vitest"

import storybookConfig from "../.storybook/main"

// VDS33 — the catalogue build must not touch dist.
//
// Storybook's react-vite builder loads the library's vite.config.ts, so
// vite-plugin-dts came along and re-ran the declaration emit under Storybook's
// resolution, overwriting what the library build had just written: every
// `from "react"` became `from "../../node_modules/react"`, a path no consumer
// can resolve, and React's types vanished in the product. It sent both products
// red for a reason that looked like the change under test.
//
// The real proof is a byte-comparison of dist across `build` then
// `build-storybook`, which takes minutes and belongs in CI's ordering rather
// than in a unit suite. What is asserted here is the mechanism: viteFinal
// removes the plugin. That is the line somebody deletes while tidying, and the
// failure it causes is silent in this repository and loud in three others.

type MinimalPlugin = { name: string }

async function pluginsAfterViteFinal(plugins: MinimalPlugin[]) {
  const viteFinal = storybookConfig.viteFinal
  expect(viteFinal, "storybook config no longer defines viteFinal").toBeDefined()

  const result = await viteFinal!(
    // Only the fields viteFinal reads; the builder passes a full Vite config.
    { plugins, resolve: { alias: {} } } as never,
    { configType: "PRODUCTION" } as never,
  )

  return ((result as { plugins?: MinimalPlugin[] }).plugins ?? []).map((p) => p.name)
}

describe("the catalogue build leaves dist alone", () => {
  it("strips the declaration-emit plugin", async () => {
    const names = await pluginsAfterViteFinal([
      { name: "unplugin-dts" },
      { name: "vite:react-babel" },
    ])

    expect(names).not.toContain("unplugin-dts")
  })

  // VDS127 — the same rule, the plugin next to it. `copy-standalone-css` copies
  // two stylesheets into dist from writeBundle, and on a checkout that has never
  // run the library build there is no dist, so copyFileSync raises ENOENT and
  // the catalogue build stops. That cost the Pages deploy 35 consecutive runs
  // and three weeks of a stale catalogue, and it is invisible locally: a
  // developer has run the build, so the directory is there.
  it("strips the stylesheet copier", async () => {
    const names = await pluginsAfterViteFinal([
      { name: "copy-standalone-css" },
      { name: "vite:react-babel" },
    ])

    expect(names).not.toContain("copy-standalone-css")
  })

  // VDS196 — `layer-package-utilities` was the third, and nothing asked. The
  // library config is the list of candidates, so it is read rather than restated:
  // a plugin with a writeBundle hook is one that can write into dist.
  // VDS210 — the timeout is sized for the loaded suite, as VDS148 sized its
  // neighbour: importing the library config loads its whole plugin chain.
  it("strips every library plugin that writes a bundle", { timeout: 30_000 }, async () => {
    const { default: libraryConfig } = await import("../vite.config")
    // A plugin entry may be an array of plugins; two levels is what Vite accepts.
    const writers = ((libraryConfig.plugins ?? []) as unknown[])
      .flat(2)
      .filter((p): p is MinimalPlugin & { writeBundle: unknown } => !!p && typeof p === "object" && "writeBundle" in p)
      .map((p) => ({ name: p.name }))

    expect(writers.map((p) => p.name)).toContain("layer-package-utilities")
    expect(await pluginsAfterViteFinal(writers)).toEqual([])
  })

  it("keeps every other plugin, so the catalogue still builds", async () => {
    const names = await pluginsAfterViteFinal([
      { name: "vite:react-babel" },
      { name: "unplugin-dts" },
      { name: "copy-standalone-css" },
      { name: "@tailwindcss/vite:generate:build" },
    ])

    expect(names).toEqual(["vite:react-babel", "@tailwindcss/vite:generate:build"])
  })

  it("keeps a plugin that has no name rather than dropping it", async () => {
    // The filter reads a name off each plugin and some carry none; dropping
    // those would take the catalogue apart to fix a dist write.
    const names = await pluginsAfterViteFinal([{} as { name: string }, { name: "vite:react-babel" }])

    expect(names).toHaveLength(2)
  })

  it("survives a config that carries no plugins at all", async () => {
    await expect(pluginsAfterViteFinal([])).resolves.toEqual([])
  })
})
