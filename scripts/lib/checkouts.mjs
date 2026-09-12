/**
 * VDS130 — where each consumer is checked out, read from `consumers.json`.
 *
 * `use:local` used to find its targets by walking the directory above this
 * checkout, which is a products root only for as long as the checkout sits
 * where it did when the walk was written. It broke one level down first, and
 * then again when this repository moved into one worktree per version: `..`
 * became the container holding only this package's own worktrees, and the walk
 * found nothing and said so in a sentence.
 *
 * So the position is declared per consumer instead. `checkout` is a path
 * relative to this repository's root, and `{line}` in it stands for the version
 * line this checkout is cut from ("2026.3"), which is what keeps a 2026.2
 * worktree pushing into the 2026.2 products and not into whatever is newest.
 * A consumer nobody checks out beside this one says `offMachine: true`, so a
 * missing checkout is always either declared absent or a finding.
 */
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"

export const LINE = "{line}"

/** The absolute checkout a consumer declares, or null when it declares none. */
export function checkoutPath(consumer, repoRoot, line) {
  if (typeof consumer.checkout !== "string" || consumer.checkout === "") return null
  return resolve(repoRoot, consumer.checkout.replaceAll(LINE, line))
}

/**
 * Every declared consumer, sorted into the ones on this machine, the ones
 * declared and not found, and the ones declared as living elsewhere.
 *
 * A checkout counts as found when it holds a `package.json`: a directory that
 * exists and is not a package is the layout having moved underneath the path.
 */
export function resolveCheckouts(register, repoRoot, line) {
  const found = []
  const missing = []
  const offMachine = []
  for (const consumer of register.consumers) {
    if (consumer.offMachine === true) {
      offMachine.push({ consumer })
      continue
    }
    const path = checkoutPath(consumer, repoRoot, line)
    if (path && existsSync(join(path, "package.json"))) found.push({ consumer, path })
    else missing.push({ consumer, path })
  }
  return { found, missing, offMachine }
}
