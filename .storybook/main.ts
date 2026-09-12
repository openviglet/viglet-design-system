import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { StorybookConfig } from "@storybook/react-vite";

const storybookDir = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    // Runs the story set as a vitest project, which is what turns the a11y
    // addon from a panel someone opens into the gate VDS6 asked for.
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  typescript: {
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      tsconfigPath: resolve(storybookDir, "tsconfig.json"),
    },
  },
  // The library's vite.config.ts aliases `use-sync-external-store/*` to a local
  // shim so the CJS build stays ESM-friendly. Storybook ships its own import
  // that hits `use-sync-external-store/shim/index.js`, which the alias rewrites
  // to `<shim>.js/index.js` and fails. Storybook compiles in dev mode where the
  // real package resolves fine, so we strip those aliases here.
  async viteFinal(cfg) {
    // The builder loads the library's vite.config.ts, and two of its plugins
    // write into dist. Neither belongs in a catalogue build, and the rule is one
    // rule: the catalogue does not touch dist. Guarded by
    // scripts/dist-stability.test.ts.
    //
    // `unplugin-dts` (VDS33) re-ran the declaration emit under Storybook's own
    // resolution and overwrote what `pnpm run build` had just written — every
    // `from "react"` became `from "../../node_modules/react"`, a path no
    // consumer can resolve, so React's types vanished in the product.
    //
    // `copy-standalone-css` (VDS127) copies two stylesheets into dist from
    // `writeBundle`. On a checkout that has never run the library build there is
    // no dist, so `copyFileSync` raises ENOENT and the build stops. It cost the
    // Pages deploy 35 consecutive runs and three weeks of a stale catalogue, and
    // it is invisible locally: a developer has run the build, so the directory
    // is there. Creating it here would be the wrong fix — that keeps a Storybook
    // build writing into dist, which is what the rule above forbids.
    const WRITES_TO_DIST = new Set(["unplugin-dts", "copy-standalone-css"]);
    if (Array.isArray(cfg.plugins)) {
      cfg.plugins = cfg.plugins.filter((plugin) => {
        const name =
          plugin && typeof plugin === "object" && "name" in plugin
            ? (plugin as { name?: string }).name
            : undefined;
        return name === undefined || !WRITES_TO_DIST.has(name);
      });
    }

    if (cfg.resolve?.alias && typeof cfg.resolve.alias === "object" && !Array.isArray(cfg.resolve.alias)) {
      const keep: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(cfg.resolve.alias)) {
        if (!k.startsWith("use-sync-external-store")) keep[k] = v;
      }
      cfg.resolve.alias = keep as typeof cfg.resolve.alias;
    }

    // `vite:react-docgen-typescript` warns for preview.tsx ("not in the active
    // TypeScript project") even when the file is in the include. It's a
    // cosmetic plugin bug (no docgen is needed for preview/config files);
    // filter it out so it doesn't clutter dev output.
    const baseLogger = cfg.customLogger ?? {
      info: console.info,
      warn: console.warn,
      warnOnce: console.warn,
      error: console.error,
      clearScreen: () => {},
      hasErrorLogged: () => false,
      hasWarned: false,
    };
    const shouldSkip = (msg: string) =>
      /Skipping docgen for .*preview\.tsx/.test(msg);
    cfg.customLogger = {
      ...baseLogger,
      warn: (msg, opts) => { if (!shouldSkip(msg)) baseLogger.warn(msg, opts); },
      warnOnce: (msg, opts) => { if (!shouldSkip(msg)) baseLogger.warnOnce(msg, opts); },
    };

    return cfg;
  },
};

export default config;
