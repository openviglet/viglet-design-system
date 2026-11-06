#!/usr/bin/env node
// VDS216 — writes dist/tokens.css from src/styles/preset.css. See scripts/lib/tokens-css.mjs.
// VDS238 — and dist/tokens.json, the same tokens resolved. See scripts/lib/tokens-json.mjs.
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { tokensCss } from "./lib/tokens-css.mjs"
import { tokensJson } from "./lib/tokens-json.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")

const css = tokensCss(preset)
writeFileSync(join(root, "dist", "tokens.css"), css)
console.log(`build-tokens: dist/tokens.css (${Buffer.byteLength(css)} bytes)`)

const json = JSON.stringify(tokensJson(preset), null, 2) + "\n"
writeFileSync(join(root, "dist", "tokens.json"), json)
console.log(`build-tokens: dist/tokens.json (${Buffer.byteLength(json)} bytes)`)
