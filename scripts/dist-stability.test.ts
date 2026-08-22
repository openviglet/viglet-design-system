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

  it("keeps every other plugin, so the catalogue still builds", async () => {
    const names = await pluginsAfterViteFinal([
      { name: "vite:react-babel" },
      { name: "unplugin-dts" },
      { name: "@tailwindcss/vite:generate:build" },
    ])

    expect(names).toEqual(["vite:react-babel", "@tailwindcss/vite:generate:build"])
  })

  it("survives a config that carries no plugins at all", async () => {
    await expect(pluginsAfterViteFinal([])).resolves.toEqual([])
  })
})
