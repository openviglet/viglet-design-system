#!/usr/bin/env node
/**
 * Starts the catalogue server from whichever directory installs the package.
 *
 * Claude Code starts a plugin's server at the project root. A product that
 * installs the package in a workspace one level down (a web client beside a Java
 * build, say) has no bin on the root's path, and `npx --no-install` there falls
 * through to the registry and fails. So this finds the installation first: from
 * the root the way an import would, then in the workspaces the root declares,
 * then in the directories a couple of levels under it. Then it runs that copy's
 * own server, so what the server says matches the release the product installed.
 */

import { spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { withinRange } from "../hooks/duplicate-guard.mjs";

const PACKAGE_NAME = "@viglet/viglet-design-system";
/** The bin in the package's own manifest that serves the catalogue. */
export const BIN = "viglet-ds-mcp";

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", "dist", "build", "out", "target", "coverage"]);
/** How far under the root an installation is looked for when no workspace names it. */
const DEPTH = 2;

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
};

/** The package's root as an import from `dir` would resolve it, or null. */
function resolvedFrom(dir) {
  try {
    // `package.json` is not in the exports map, and `exports.json` is.
    const manifest = createRequire(join(dir, "noop.js")).resolve(`${PACKAGE_NAME}/exports.json`);
    return resolve(dirname(manifest), "..");
  } catch {
    return null;
  }
}

const childDirs = (dir) => {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith(".") && !SKIP.has(entry.name))
      .map((entry) => join(dir, entry.name));
  } catch {
    return [];
  }
};

/** The directories a workspace pattern names: a literal path, or a trailing `*` or `**` for its children. */
function expand(root, pattern) {
  if (pattern.startsWith("!")) return [];
  const clean = pattern.replace(/^\.\//, "").replace(/\/+$/, "");
  const star = clean.match(/^(.*?)\/?\*\*?$/);
  if (star) return childDirs(join(root, star[1]));
  return [join(root, clean)];
}

/** What the root declares as workspaces, in npm, yarn or pnpm form. */
function workspacePatterns(root) {
  const manifest = readJson(join(root, "package.json"));
  const declared = Array.isArray(manifest?.workspaces) ? manifest.workspaces : (manifest?.workspaces?.packages ?? []);
  let pnpm = [];
  try {
    const yaml = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
    pnpm = [...yaml.matchAll(/^\s*-\s*["']?([^"'\n#]+?)["']?\s*$/gm)].map((match) => match[1]);
  } catch {
    // No pnpm workspace.
  }
  return [...declared, ...pnpm];
}

/**
 * Every installation of the package reachable from `root`, nearest first: the
 * root's own resolution, then each declared workspace, then each directory down to
 * a fixed depth. Each is `{ packageRoot, version }`.
 */
export function findInstallations(root) {
  const found = new Map();
  const add = (packageRoot) => {
    if (!packageRoot || found.has(packageRoot)) return;
    const version = readJson(join(packageRoot, "dist", "exports.json"))?.version;
    if (typeof version === "string") found.set(packageRoot, { packageRoot, version });
  };

  add(resolvedFrom(root));
  for (const pattern of workspacePatterns(root)) {
    for (const dir of expand(root, pattern)) add(resolvedFrom(dir));
  }
  let level = [root];
  for (let depth = 0; depth < DEPTH; depth++) {
    level = level.flatMap(childDirs);
    for (const dir of level) {
      const candidate = join(dir, "node_modules", ...PACKAGE_NAME.split("/"));
      if (existsSync(candidate)) add(candidate);
    }
  }
  return [...found.values()];
}

/** The installation to serve: the nearest inside the plugin's supported range, else the nearest. */
export function chooseInstallation(installations) {
  const range = readJson(join(pluginRoot, "package.json"))?.supportedPackage?.[PACKAGE_NAME] ?? "";
  return installations.find((i) => withinRange(i.version, range)) ?? installations[0] ?? null;
}

function main() {
  const root = resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const chosen = chooseInstallation(findInstallations(root));
  if (!chosen) {
    process.stderr.write(
      `${BIN}: no installation of ${PACKAGE_NAME} under ${root}, in its workspaces or ${DEPTH} levels down. ` +
        "Install the package in the product, or start the server with its path: " +
        `node <dir>/node_modules/${PACKAGE_NAME}/scripts/mcp.mjs\n`,
    );
    process.exit(1);
  }

  const bin = readJson(join(chosen.packageRoot, "package.json"))?.bin?.[BIN];
  const script = bin ? join(chosen.packageRoot, bin) : null;
  if (!script || !existsSync(script)) {
    process.stderr.write(`${BIN}: ${PACKAGE_NAME} ${chosen.version} at ${chosen.packageRoot} ships no catalogue server.\n`);
    process.exit(1);
  }

  const child = spawn(process.execPath, [script, ...process.argv.slice(2)], { stdio: "inherit" });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
