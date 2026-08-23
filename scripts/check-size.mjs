#!/usr/bin/env node
/**
 * VDS26 — measure what the subpath was chosen for.
 *
 * `./bento` was made a subpath export rather than folded into the root barrel
 * on the argument that a consumer still on console chrome should not pay for
 * the bento layer. That argument was never measured, and an unmeasured argument
 * about cost is the same defect as a premise carried in a comment: it fails
 * quietly, in somebody else's build.
 *
 * So this bundles two fixtures **through the package's own `exports` map** —
 * a symlinked `node_modules` entry, so the resolution is a consumer's and not a
 * relative path that would bypass the map — and asserts:
 *
 *   1. a root-only consumer's bundle contains no bento module and no bento CSS;
 *   2. a bento consumer's does (otherwise the first assertion proves nothing);
 *   3. both stay within tolerance of a recorded baseline, so a component moved
 *      here without care surfaces as a number rather than as a feeling.
 *
 * It runs at the end of `pnpm run build`, beside check-dist. That was not
 * affordable when it was written: bundling 2.25 MB of base64 took about a
 * minute, so it lived in CI and a regression was first seen in a diff. VDS40
 * and VDS41 took the pictures and the fonts out, and the same three fixtures
 * now bundle in 1.6 s against an 11 s build — which is the whole argument for
 * folding it in, and the reason VDS42 waited on them.
 *
 * Usage:
 *   node scripts/check-size.mjs             # gate
 *   node scripts/check-size.mjs --update    # re-record the baseline
 *   node scripts/check-size.mjs --json      # machine-readable result
 */
import { gzipSync } from "node:zlib"
import {
  mkdirSync,
  readdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { basename, dirname, join, resolve } from "node:path"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

import { EXTERNAL_PATTERNS } from "./lib/externals.mjs"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const PKG = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).name
const BASELINE = join(root, "size-budget.json")

/**
 * How far a fixture may drift before the gate complains.
 *
 * 2%, not 10%: the root entry is large, and 10% of it is more than the entire
 * bento layer — a budget that cannot notice the thing it exists to notice. The
 * content assertion below is what actually catches the layer; this catches
 * everything else growing quietly.
 */
export const TOLERANCE = 0.02

/**
 * The two consumers whose cost is being asserted.
 *
 * Each imports its whole entry rather than a handful of names. That makes the
 * claim as strong as it can be — not even a consumer taking *everything* from
 * the root entry pulls a bento module — and it makes the recorded number stable
 * under a rename, which a hand-picked list of imports is not.
 */
const FIXTURES = {
  "root-only": {
    source: [
      `import * as ds from "${PKG}";`,
      `import "${PKG}/styles";`,
      // Assigning the namespace to a global is what forces it to be
      // materialised. `export default ds` is not enough: the bundler can see
      // no member is ever read and drops the lot, and the first draft of this
      // check recorded a 0-byte chunk and called it a measurement.
      "globalThis.__vdsProbe = Object.keys(ds).length;",
    ].join("\n"),
    bentoExpected: false,
    // And no other subpath's rules either. `./bento` had a check of its own;
    // `./floating-formulas-bg` did not, and shipped inside `./styles` to
    // everyone for want of one (VDS45).
    subpathFree: true,
  },
  bento: {
    source: [
      `import * as bento from "${PKG}/bento";`,
      `import "${PKG}/bento.css";`,
      "globalThis.__vdsProbe = Object.keys(bento).length;",
    ].join("\n"),
    bentoExpected: true,
  },
  // VDS41 — the brand faces, which left `./styles` and became opt-in. This
  // fixture measures what opting in costs, and, more importantly, proves it
  // resolves: `fonts.css` ships verbatim, so its `@fontsource-variable/*`
  // imports are resolved from wherever the consumer's bundler looks. Bundling
  // it here is the only way to find out before a product does.
  fonts: {
    source: [`import "${PKG}/fonts";`, "globalThis.__vdsProbe = 1;"].join("\n"),
    bentoExpected: false,
    mustEmbedFonts: true,
  },
}

/**
 * Evidence that the bento layer is present in an emitted bundle.
 *
 * Matched on **content**, not on module paths. The first draft matched paths
 * like `dist/bento.es.js` and was defeated by the very thing it guards: a
 * `export { BentoHero } from "./bento"` in the root barrel makes the library
 * build inline the layer into a shared chunk, so no bento-shaped path ever
 * appears in a consumer's graph and the check passed while the layer shipped.
 *
 * The markers below are class names the layer writes as string literals, so
 * they survive minification, and — for CSS — the `.bento-` *selector*, which is
 * the layer's rules. `--vg-bento-*` is deliberately not a marker: those are
 * tokens, they live in the preset with every other token, and they are about a
 * kilobyte of custom properties rather than the layer arriving.
 */
export function bentoEvidence(chunks) {
  const JS_MARKERS = ["bento-tone-", "bento-chip", "bento-fade"]
  const found = []

  for (const chunk of chunks) {
    const text = chunk.type === "asset" ? String(chunk.source) : chunk.code
    if (chunk.fileName.endsWith(".css")) {
      if (/(^|[^-\w])\.bento-/.test(text)) found.push(`${chunk.fileName}: .bento-* rules`)
      continue
    }
    const hits = JS_MARKERS.filter((m) => text.includes(m))
    if (hits.length > 0) found.push(`${chunk.fileName}: ${hits.join(", ")}`)
  }

  return found
}

/**
 * Class selectors a stylesheet defines, as a set.
 *
 * Used to ask the general question the bento check asks the specific one: does
 * a consumer of `./styles` carry rules that belong to a subpath? It did —
 * `cssCodeSplit: false` merged every entry's CSS, so `floating-formulas-bg.css`
 * shipped to everyone while its component sat behind its own subpath (VDS45).
 * A bento-shaped check could not see that, which is the argument for asking by
 * selector rather than by name.
 */
export function selectorsIn(css) {
  const found = new Set()
  for (const [, name] of css.matchAll(/(?:^|[\s,{}>+~])\.([a-zA-Z][\w-]{4,})/g)) found.add(name)
  return found
}

/**
 * Rules from a subpath stylesheet that turned up in a bundle that never asked
 * for it. `subpathCss` is `{ label: css }` — the stylesheets a consumer imports
 * separately, read from `dist`.
 */
export function subpathLeakage(chunks, subpathCss) {
  const bundled = new Set()
  for (const chunk of chunks) {
    if (chunk.fileName.endsWith(".css")) {
      for (const name of selectorsIn(String(chunk.source))) bundled.add(name)
    }
  }

  const leaks = []
  for (const [label, css] of Object.entries(subpathCss)) {
    const shared = [...selectorsIn(css)].filter((name) => bundled.has(name))
    // A handful of names can coincide — a utility both files happen to define.
    // A subpath arriving whole looks nothing like that.
    if (shared.length > 5) {
      leaks.push(`${label}: ${shared.length} of its selectors are here, e.g. .${shared.slice(0, 3).join(", .")}`)
    }
  }
  return leaks
}

/**
 * The largest an inlined asset may be in a consumer's bundle.
 *
 * VDS40 — Vite's library mode inlines every asset regardless of
 * `assetsInlineLimit`, so an asset reachable from an entry is base64 in that
 * entry, uncacheable and uncompressible. A 2096x2096 product logo reached the
 * root barrel through `productLogos` and put 1.24 MB there, for a picture
 * nothing in this package renders. The cap is well above the three logos the
 * app switcher does render and well below another of those.
 */
export const MAX_INLINE_ASSET = 256 * 1024

/** Inlined assets over the cap, as `blob-<n>: <bytes>` for the failure message. */
export function oversizedAssets(chunks) {
  const found = []
  for (const chunk of chunks) {
    if (chunk.type === "asset") continue
    let n = 0
    // The payload, not the `base64,` prefix — the number in the message should
    // be the asset's size, so it can be compared with the file on disk.
    for (const [, payload] of chunk.code.matchAll(/base64,([A-Za-z0-9+/=]{200,})/g)) {
      n += 1
      if (payload.length > MAX_INLINE_ASSET) {
        found.push(`${chunk.fileName}: inlined asset #${n} is ${payload.length} bytes`)
      }
    }
  }
  return found
}

/**
 * How many `@font-face` rules a bundle carries.
 *
 * The point is resolution, not weight: `fonts.css` ships verbatim, so its
 * `@fontsource-variable/*` imports resolve in the consumer's tree. If that ever
 * stops working the import fails silently to nothing, the type falls back to
 * `system-ui`, and nobody finds out until they look at a screenshot.
 */
export function fontFaces(chunks) {
  let n = 0
  for (const chunk of chunks) {
    if (chunk.fileName.endsWith(".css")) n += (String(chunk.source).match(/@font-face/g) ?? []).length
  }
  return n
}

/** Compares one measurement with its baseline, returning null when it is fine. */
export function drift(name, measured, recorded, tolerance = TOLERANCE) {
  if (recorded === undefined) return `${name}: no baseline recorded — run with --update`
  const delta = (measured - recorded) / recorded
  if (Math.abs(delta) <= tolerance) return null
  const percent = (delta * 100).toFixed(1)
  return `${name}: ${recorded} -> ${measured} bytes gzipped (${delta > 0 ? "+" : ""}${percent}%)`
}

async function bundle(name, { source }) {
  const { build } = await import("vite")

  const dir = mkdtempSync(join(tmpdir(), `vds-size-${name}-`))
  try {
    // A real node_modules entry, so Vite resolves through the package's exports
    // map exactly as a product does. A junction is used because it needs no
    // elevation on Windows; symlinkSync falls back to it there.
    const modules = join(dir, "node_modules", ...PKG.split("/"))
    mkdirSync(dirname(modules), { recursive: true })
    symlinkSync(root, modules, "junction")

    writeFileSync(join(dir, "entry.js"), source)

    const output = await build({
      root: dir,
      logLevel: "silent",
      configFile: false,
      build: {
        outDir: join(dir, "out"),
        write: false,
        minify: "esbuild",
        rollupOptions: {
          input: join(dir, "entry.js"),
          // The library build's own list, not a restatement of it. Everything
          // here is something a consumer supplies, so counting it would measure
          // the consumer's dependencies as this package's weight — which is
          // what an earlier version did, putting 467 KB of xlsx in a number
          // meant to describe `dist`.
          external: EXTERNAL_PATTERNS,
        },
      },
    })

    const chunks = (Array.isArray(output) ? output[0].output : output.output) ?? []
    let raw = 0
    let gzip = 0
    for (const c of chunks) {
      const buffer = Buffer.from(c.type === "asset" ? c.source : c.code)
      raw += buffer.byteLength
      gzip += gzipSync(buffer).byteLength
    }

    return { raw, gzip, chunks }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/**
 * Everything one bundled fixture has to be true of, as failure messages.
 *
 * Exported so the tests can hold each rule without paying for a bundle: what a
 * fixture must contain is as much a decision as what it must not, and both
 * halves have been wrong here before.
 */
export function assess(name, fixture, chunks, subpathCss = {}) {
  const failures = []
  const bento = bentoEvidence(chunks)
  const faces = fontFaces(chunks)

  if (fixture.subpathFree) {
    for (const leak of subpathLeakage(chunks, subpathCss)) {
      failures.push(`${name}: ${leak} — a subpath's rules reached a consumer that did not import it`)
    }
  }

  if (fixture.bentoExpected && bento.length === 0) {
    // Without this the opposite assertion is vacuous: a fixture that resolves
    // nothing also contains no bento module.
    failures.push(
      `${name}: no bento artefact in a fixture that imports ./bento — the check is measuring nothing`,
    )
  } else if (!fixture.bentoExpected && bento.length > 0) {
    failures.push(
      `${name}: the bento layer reached a consumer that never imported it\n    ${bento.join("\n    ")}`,
    )
  }

  if (fixture.mustEmbedFonts && faces === 0) {
    failures.push(
      `${name}: no @font-face resolved — fonts.css ships verbatim, so its ` +
        `@fontsource imports have to resolve in the consumer's tree, and here they did not`,
    )
  } else if (!fixture.mustEmbedFonts && faces > 0) {
    failures.push(
      `${name}: ${faces} @font-face rules — the faces are back in an entry ` +
        `that is not ./fonts, which is what VDS41 took them out of`,
    )
  }

  for (const oversized of oversizedAssets(chunks)) {
    failures.push(`${name}: ${oversized} — inline it smaller, or move it off this entry`)
  }

  return failures
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const update = args.has("--update")
  const asJson = args.has("--json")

  const baseline = update ? {} : JSON.parse(readFileSync(BASELINE, "utf8"))
  // The stylesheets a consumer imports separately, read from **source**.
  //
  // Reading them from `dist` was the first attempt and was vacuous in exactly
  // the failure it guards: with the CSS merged, `dist/floating-formulas-bg.css`
  // is never emitted, so there was nothing to compare the bundle against and
  // the leak went unnoticed. The source is there either way.
  //
  // A stylesheet counts as a subpath's when the `exports` map publishes it as
  // its own entry — not merely because it exists. `login.css` and
  // `startup-first.css` belong to components in the root barrel, so their rules
  // are exactly what `./styles` is for; a first draft swept those up and said
  // so. Discovered rather than listed, so a fourth entry is covered the day it
  // is added.
  const MAIN_CHAIN = new Set(["./styles", "./preset", "./preset.css"])
  const subpathCss = {}
  const sources = new Map()
  const findCss = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) findCss(full)
      else if (entry.name.endsWith(".css")) sources.set(entry.name, full)
    }
  }
  findCss(join(root, "src"))

  for (const [subpath, target] of Object.entries(
    JSON.parse(readFileSync(join(root, "package.json"), "utf8")).exports,
  )) {
    if (typeof target !== "string" || !target.endsWith(".css")) continue
    if (MAIN_CHAIN.has(subpath)) continue
    // From source, not from dist: with the CSS merged, `dist/…` is never
    // emitted, so there would be nothing to compare against in exactly the
    // failure this guards. A first draft read dist and was vacuous for it.
    const source = sources.get(basename(target))
    if (source) subpathCss[subpath] = readFileSync(source, "utf8")
  }

  const measured = {}
  const failures = []

  for (const [name, fixture] of Object.entries(FIXTURES)) {
    const { raw, gzip, chunks } = await bundle(name, fixture)
    measured[name] = { raw, gzip }

    failures.push(...assess(name, fixture, chunks, subpathCss))

    if (!update) {
      const d = drift(name, gzip, baseline[name]?.gzip)
      if (d) failures.push(d)
    }
  }

  if (update) {
    writeFileSync(BASELINE, JSON.stringify(measured, null, 2) + "\n")
    console.log(`recorded baseline in size-budget.json:`)
    for (const [name, m] of Object.entries(measured)) {
      console.log(`  ${name.padEnd(10)} ${m.gzip} gzipped, ${m.raw} raw`)
    }
    return
  }

  if (asJson) {
    console.log(JSON.stringify({ measured, baseline, failures }, null, 2))
  } else {
    for (const [name, m] of Object.entries(measured)) {
      console.log(`  ${name.padEnd(10)} ${m.gzip} gzipped (baseline ${baseline[name]?.gzip ?? "none"}), ${m.raw} raw`)
    }
  }

  if (failures.length > 0) {
    console.error("\nsize budget:")
    for (const f of failures) console.error(`  ${f}`)
    console.error("\n  If the change is intended, re-record with: node scripts/check-size.mjs --update")
    process.exitCode = 1
  }
}

// Importable for the unit tests without running the (slow) bundles.
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main()
}
