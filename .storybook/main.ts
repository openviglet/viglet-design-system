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
