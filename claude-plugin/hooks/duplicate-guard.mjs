#!/usr/bin/env node
/**
 * The duplicate check, run on a component file before it is written.
 *
 * `viglet-ds-check-duplicates` fails a product's CI when a file declares a name
 * the package already exports. By then the copy exists, has callers and has a
 * reviewer who has to argue it out. As the file is written, the right import is
 * one line to take instead, so this runs the same check on what the write would
 * produce and denies it with the replacement named.
 *
 * It decides nothing else. Anything it cannot read, a file that is not source,
 * a repository that does not install the package, or an installed version outside
 * the range this plugin supports, gets an empty answer, which leaves the
 * write to every permission rule the user already set. An `allow` would grant it.
 *
 * The check itself is the installed package's own script against the installed
 * package's own export list, so the answer is the one CI will give.
 */

import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_NAME = "@viglet/viglet-design-system";
const SOURCE = new Set([".ts", ".tsx", ".js", ".jsx", ".mts", ".mjs"]);

const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** No opinion: the write goes to whatever the user's own rules say. */
function pass() {
  process.exit(0);
}

function readPayload() {
  try {
    return JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return null;
  }
}

/** What the file holds once the tool has run, or null where that cannot be known. */
export function contentAfter(tool, input) {
  if (tool === "Write") return typeof input.content === "string" ? input.content : null;

  let text = existsSync(input.file_path) ? readFileSync(input.file_path, "utf8") : null;
  const edits = tool === "MultiEdit" ? (input.edits ?? []) : [input];
  for (const edit of edits) {
    const { old_string: from, new_string: to, replace_all: all } = edit;
    if (typeof from !== "string" || typeof to !== "string") return null;
    if (from === "") {
      // Creating a file through an edit.
      text = (text ?? "") + to;
      continue;
    }
    if (text === null || !text.includes(from)) return null;
    text = all ? text.split(from).join(to) : text.replace(from, () => to);
  }
  return text;
}

/** `2026.3.11` -> [2026, 3, 11], for the plain ranges this plugin declares. */
const parts = (version) => version.split(/[.-]/).slice(0, 3).map((n) => Number.parseInt(n, 10) || 0);

function compare(a, b) {
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** Whether `version` satisfies a range written as `>=a <b`, the only form declared. */
export function withinRange(version, range) {
  return range.split(/\s+/).filter(Boolean).every((clause) => {
    const match = /^(>=|<=|>|<|=)?(\d[\w.-]*)$/.exec(clause);
    if (!match) return false;
    const order = compare(version, match[2]);
    switch (match[1]) {
      case ">=": return order >= 0;
      case "<=": return order <= 0;
      case ">": return order > 0;
      case "<": return order < 0;
      default: return order === 0;
    }
  });
}

/** The installed package's root, found the way the file's own imports would find it. */
function installedPackage(file) {
  try {
    // `package.json` is not in the exports map, and `exports.json` is.
    const manifest = createRequire(file).resolve(`${PACKAGE_NAME}/exports.json`);
    return resolve(dirname(manifest), "..");
  } catch {
    return null;
  }
}

function main() {
  const payload = readPayload();
  const input = payload?.tool_input;
  if (!input || typeof input.file_path !== "string") pass();

  const file = resolve(payload.cwd ?? process.cwd(), input.file_path);
  if (!SOURCE.has(extname(file)) || /[\\/]node_modules[\\/]/.test(file)) pass();

  const root = installedPackage(file);
  if (!root) pass();

  const range = JSON.parse(readFileSync(join(pluginRoot, "package.json"), "utf8")).supportedPackage[PACKAGE_NAME];
  const version = JSON.parse(readFileSync(join(root, "dist", "exports.json"), "utf8")).version;
  if (!withinRange(version, range)) pass();

  const content = contentAfter(payload.tool_name, { ...input, file_path: file });
  if (content === null) pass();

  const findings = duplicates(root, basename(file), content);
  if (findings.length === 0) pass();

  const lines = findings.map((f) => `  line ${f.line} declares ${f.name}; use instead: ${f.replacement}`);
  const reason =
    `${input.file_path} would declare ${findings.length === 1 ? "a name" : "names"} ${PACKAGE_NAME} already exports:\n` +
    `${lines.join("\n")}\n` +
    "Import the shared one rather than writing a copy that drifts. If this copy is deliberate, " +
    `say why in the file: // viglet-ds-allow-duplicate ${findings[0].name} -- <reason>`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: reason,
      },
    }),
  );
}

/**
 * The installed check's findings for one file's content. The check scans
 * directories, so the file as it will be goes into a directory of its own, which
 * is gone again before this returns.
 */
function duplicates(root, name, content) {
  const check = join(root, "scripts", "check-duplicates.mjs");
  if (!existsSync(check)) return [];

  const scratch = mkdtempSync(join(tmpdir(), "viglet-ds-guard-"));
  try {
    writeFileSync(join(scratch, name), content);
    const run = spawnSync(
      process.execPath,
      [check, scratch, "--json", "--manifest", join(root, "dist", "exports.json")],
      { encoding: "utf8" },
    );
    return JSON.parse(run.stdout).findings ?? [];
  } catch {
    return [];
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // A guard that crashes is a guard that shows an error on every write. Anything
  // unexpected is no opinion, like everything else it cannot read.
  try {
    main();
  } catch {
    pass();
  }
}
