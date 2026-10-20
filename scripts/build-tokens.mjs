#!/usr/bin/env node
// VDS216 — writes dist/tokens.css from src/styles/preset.css. See scripts/lib/tokens-css.mjs.
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { tokensCss } from "./lib/tokens-css.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const css = tokensCss(readFileSync(join(root, "src", "styles", "preset.css"), "utf8"))
writeFileSync(join(root, "dist", "tokens.css"), css)
console.log(`build-tokens: dist/tokens.css (${Buffer.byteLength(css)} bytes)`)
