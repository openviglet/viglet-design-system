#!/usr/bin/env node
/**
 * VDS49 — an export is a promise a consumer can keep.
 *
 * `check-dist` asserts that every path the `exports` map promises is a file in
 * `dist`. That is weaker than the promise. A `types` field pointing at the
 * wrong `.d.ts`, an `import` naming a chunk that does not resolve, an entry
 * that throws at module scope — each leaves the file exactly where it said and
 * breaks in a product.
 *
 * So this asks the two questions a consumer asks:
 *
 *   1. does every subpath **resolve and bundle**? One fixture imports all of
 *      them at once, which costs one bundle rather than fifteen and still names
 *      the specifier when one fails.
 *   2. does every typed subpath **type-check**? A generated probe imports a
 *      real exported value from each and uses it, so a `types` field resolving
 *      to the wrong declarations is an error rather than a silent `any`.
 *
 * The names come from `dist/exports.json`, which the build already emits, so a
 * subpath added tomorrow is covered without anyone listing it here.
 */
import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

import { EXTERNAL_PATTERNS } from "./lib/externals.mjs"
import { withConsumer } from "./lib/consumer-fixture.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
const PKG = manifest.name

/** `"./bento"` -> `"@viglet/viglet-design-system/bento"`. */
const specifier = (subpath) => (subpath === "." ? PKG : PKG + subpath.slice(1))

/** Whether a subpath's target is a stylesheet rather than a module. */
const isStylesheet = (target) => typeof target === "string" && target.endsWith(".css")

/**
 * One module importing every subpath.
 *
 * A stylesheet is a bare side-effect import; a module has its namespace read at
 * runtime, because a namespace nothing touches is tree-shaken away and a bundle
 * that resolved nothing also fails to prove anything (the mistake `check-size`
 * made and records).
 */
export function importEverything(exportsMap) {
  const lines = []
  const reads = []
  let n = 0

  for (const [subpath, target] of Object.entries(exportsMap)) {
    const spec = specifier(subpath)
    if (isStylesheet(target)) {
      lines.push(`import ${JSON.stringify(spec)};`)
      continue
    }
    if (subpath.endsWith(".json")) {
      lines.push(`import m${n} from ${JSON.stringify(spec)} with { type: "json" };`)
    } else {
      lines.push(`import * as m${n} from ${JSON.stringify(spec)};`)
    }
    reads.push(`m${n}`)
    n += 1
  }

  lines.push(`globalThis.__vdsProbe = [${reads.join(", ")}].map((m) => Object.keys(m).length);`)
  return lines.join("\n")
}

/**
 * A TypeScript module importing one real value from every typed entry.
 *
 * Reading the names from the catalogue rather than naming them here is what
 * keeps this covering a subpath nobody remembered to add — and the value is
 * *used*, so a `types` field that resolves somewhere unhelpful fails instead of
 * quietly becoming `any`.
 */
export function typeProbe(catalogue) {
  const lines = []
  const used = []
  let n = 0

  for (const [subpath, entry] of Object.entries(catalogue.entries)) {
    const name = (entry.values ?? [])[0]
    if (!name) continue
    lines.push(`import { ${name} } from ${JSON.stringify(entry.specifier)}; // ${subpath}`)
    used.push(name)
    n += 1
  }

  if (n === 0) {
    throw new Error("dist/exports.json lists no value export — the probe would assert nothing")
  }
  lines.push(`export const used: unknown[] = [${used.join(", ")}];`)
  return lines.join("\n")
}

const TSCONFIG = JSON.stringify(
  {
    compilerOptions: {
      moduleResolution: "bundler",
      module: "esnext",
      target: "esnext",
      strict: true,
      noEmit: true,
      jsx: "react-jsx",
      // The declarations are the package's business; what is under test is
      // whether a consumer can resolve and use them.
      skipLibCheck: true,
      types: [],
    },
    include: ["probe.ts"],
  },
  null,
  2,
)

async function main() {
  const failures = []
  const exportsMap = manifest.exports
  const cataloguePath = join(root, "dist", "exports.json")

  if (!existsSync(cataloguePath)) {
    console.error("check-exports: dist/exports.json is missing — run the build first")
    process.exitCode = 1
    return
  }
  const catalogue = JSON.parse(readFileSync(cataloguePath, "utf8"))

  const { build } = await import("vite")

  await withConsumer(root, PKG, { "entry.js": importEverything(exportsMap) }, async (dir) => {
    try {
      await build({
        root: dir,
        logLevel: "silent",
        configFile: false,
        build: {
          outDir: join(dir, "out"),
          write: false,
          rollupOptions: { input: join(dir, "entry.js"), external: EXTERNAL_PATTERNS },
        },
      })
    } catch (error) {
      const first = String(error?.message ?? error).split("\n").slice(0, 4).join("\n      ")
      failures.push(`a subpath did not resolve or bundle:\n      ${first}`)
    }
  })

  await withConsumer(
    root,
    PKG,
    { "probe.ts": typeProbe(catalogue), "tsconfig.json": TSCONFIG },
    async (dir) => {
      const tsc = spawnSync(
        process.execPath,
        [join(root, "node_modules", "typescript", "lib", "tsc.js"), "-p", "tsconfig.json"],
        { cwd: dir, encoding: "utf8" },
      )
      if (tsc.status !== 0) {
        const said = (tsc.stdout || tsc.stderr || "").trim().split("\n").slice(0, 6).join("\n      ")
        failures.push(`a typed subpath did not type-check for a consumer:\n      ${said}`)
      }
    },
  )

  const typed = Object.keys(catalogue.entries).length
  const total = Object.keys(exportsMap).length

  if (failures.length > 0) {
    console.error(`\ncheck-exports: ${failures.length} problem(s)\n`)
    for (const failure of failures) console.error(`  - ${failure}`)
    console.error("")
    process.exitCode = 1
    return
  }

  console.log(`check-exports: ${total} subpaths import, ${typed} type-check — clean.`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main()
}
