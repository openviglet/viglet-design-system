/**
 * A throwaway directory that resolves this package the way a product does.
 *
 * The point is the `node_modules` entry: a junction to the repository root, so
 * every specifier goes through the real `exports` map. A relative path into
 * `dist` would bypass the map entirely, and the map is most of what these
 * checks are about.
 *
 * Shared by `check-size` and `check-exports` rather than written twice — a
 * restatement is a restatement whether it is a list or a setup, and this block
 * has spent four tasks on that.
 */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"

/**
 * Runs `body(dir)` inside a fixture directory holding `files`, and removes it
 * afterwards whether or not the body threw.
 *
 * `junction` rather than a symlink: it needs no elevation on Windows, which is
 * where this runs.
 */
export async function withConsumer(root, pkg, files, body) {
  const dir = mkdtempSync(join(tmpdir(), "vds-consumer-"))
  try {
    const linked = join(dir, "node_modules", ...pkg.split("/"))
    mkdirSync(dirname(linked), { recursive: true })
    symlinkSync(root, linked, "junction")

    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dir, name), content)
    }
    return await body(dir)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
