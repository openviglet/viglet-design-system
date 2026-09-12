import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/**
 * Every product that installs this package, by the name a person reads.
 *
 * A shared string naming one of them is the defect: a console that is not that
 * product renders another product's name, in every language, and the string is
 * shared precisely because nobody re-reads it.
 *
 * Read from `consumers.json` rather than written here. That file already calls
 * itself the one place the set lives, and the list had been typed out a second
 * time inside the bundle gate — which is how VDS73 came to widen one copy of it
 * from three names to seven. VDS109 gave the set a second reader (the inline
 * `defaultValue` sweep in `i18n/literals.test.ts`), so a third copy would have
 * been the one nobody widens.
 */
const manifest = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../consumers.json"), "utf8"),
) as { consumers: { name: string }[] }

export const CONSUMER_PRODUCTS: readonly string[] = manifest.consumers.map((c) => c.name)
