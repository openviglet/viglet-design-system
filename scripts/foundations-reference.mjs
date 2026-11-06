#!/usr/bin/env node
/**
 * VDS239 — the foundation cards: type, radius and control height, drawn from
 * the tokens.
 *
 *   node scripts/foundations-reference.mjs           # write docs/reference/foundations.dc.html
 *   node scripts/foundations-reference.mjs --check   # fail when the committed page is stale
 *
 * The colour cards already exist (`grounds.dc.html`, and `site.dc.html`, which
 * is generated). This is the rest of what a designer reaches for first, and it
 * is generated the same way: the radii, the control heights and the faces come
 * from `tokensJson` (VDS238), so the card says what `tokens.json` says, and the
 * type steps come from Tailwind's own `theme.css`, which is where the sizes the
 * components write (`text-sm`, `text-2xl`) are defined. Nothing on it is typed.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { tokensJson } from "./lib/tokens-json.mjs"

export const WIDTH = 1280
export const HEIGHT = 620

/**
 * The steps the components use, largest first, with what each one sets. The
 * roles are read off the components: `BentoEntityShell` titles an entity at
 * 2xl and 3xl, `BentoSection` heads at xl and 2xl, and so on.
 */
export const TYPE_STEPS = [
  { step: "3xl", role: "An entity's title, from md up" },
  { step: "2xl", role: "An entity's title; a section heading from md" },
  { step: "xl", role: "A section heading; a working page's title" },
  { step: "lg", role: "A tile, form section or empty state title from md; a dialog title" },
  { step: "base", role: "A tile or form section title" },
  { step: "sm", role: "Body, subtitles and controls" },
  { step: "xs", role: "Eyebrows, meta and badges" },
]

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const round = (value) => Math.round(value * 100) / 100

/** Tailwind's `--text-<step>` and its line height, in px at a 16 px root. */
export function typeScale(theme) {
  return TYPE_STEPS.map(({ step, role }) => {
    const size = new RegExp(`--text-${step}:\\s*([\\d.]+)rem;`).exec(theme)
    const line = new RegExp(`--text-${step}--line-height:\\s*calc\\(\\s*([\\d.]+)\\s*/\\s*([\\d.]+)\\s*\\);`).exec(theme)
    if (!size || !line) throw new Error(`foundations-reference: Tailwind's theme.css has no --text-${step}`)
    const px = Number(size[1]) * 16
    return { step, role, size: round(px), line: round(px * (Number(line[1]) / Number(line[2]))) }
  })
}

const card = (title, sub, body) => `
    <div style="border:1px solid #e5e5e5;border-radius:10px;background:#ffffff;padding:16px 18px;display:flex;flex-direction:column;gap:12px;min-height:0">
      <div>
        <div style="font-size:14px;font-weight:600;letter-spacing:-0.01em">${escape(title)}</div>
        <div style="font-size:11.5px;color:#696969;margin-top:2px">${escape(sub)}</div>
      </div>${body}
    </div>`

function typeCard(scale, fonts) {
  const sans = fonts.sans.$value[0]
  const brand = fonts.brand.$value[0]
  const mono = fonts.mono.$value[0]
  const rows = scale
    .map(
      (s) => `
        <div class="type-step" data-step="${s.step}" data-size="${s.size}" style="display:grid;grid-template-columns:64px 72px 1fr;align-items:baseline;gap:10px">
          <span class="mono" style="font-size:11px;color:#1447e6">text-${s.step}</span>
          <span class="mono" style="font-size:10.5px;color:#696969">${s.size} / ${s.line}</span>
          <span style="display:flex;flex-direction:column;min-width:0">
            <span style="font-size:${s.size}px;line-height:${s.line}px;font-weight:${s.size >= 16 ? 600 : 400};letter-spacing:${s.size >= 20 ? "-0.015em" : "0"};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Says what it does</span>
            <span style="font-size:10px;color:#696969">${escape(s.role)}</span>
          </span>
        </div>`,
    )
    .join("")
  const faces = `
        <div style="border-top:1px solid #e5e5e5;padding-top:10px;display:grid;grid-template-columns:64px 1fr;gap:6px 10px;align-items:baseline">
          <span class="mono" style="font-size:11px;color:#1447e6">sans</span>
          <span style="font-size:13px">${escape(sans)}: labels, body and controls</span>
          <span class="mono" style="font-size:11px;color:#1447e6">brand</span>
          <span><span style="font-family:'${escape(brand)}','Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px">${escape(brand)}</span> <span style="font-size:11px;color:#696969">display face; Inter under warm and navy</span></span>
          <span class="mono" style="font-size:11px;color:#1447e6">mono</span>
          <span class="mono" style="font-size:12px">${escape(mono)} · text-mono 12 px: ids, paths, keys</span>
        </div>`
  return card("Type", "Tailwind's steps, as the components set them. Size / line height in px.", rows + faces)
}

function radiusCard(dimension) {
  const radii = ["radius-control", "radius-panel", "radius-full"].map((name) => ({ name, px: dimension[name].$extensions["com.viglet"].reactNative }))
  const uses = { "radius-control": "Buttons, fields, menu items", "radius-panel": "Cards, dialogs, popovers, every bento surface", "radius-full": "Pills, avatars, the state dot" }
  const body = radii
    .map(
      (r) => `
        <div class="radius" data-token="--vg-${r.name}" data-px="${r.px}" style="display:flex;align-items:center;gap:14px">
          <span style="width:64px;height:64px;flex:none;border:1.5px solid #1447e6;background:#eff6ff;border-radius:${Math.min(r.px, 32)}px"></span>
          <span style="display:flex;flex-direction:column;gap:2px">
            <span class="mono" style="font-size:11px;color:#1447e6">--vg-${r.name}</span>
            <span style="font-size:13px;font-weight:600">${r.px >= 999 ? "Full" : `${r.px} px`}</span>
            <span style="font-size:10.5px;color:#696969">${escape(uses[r.name])}</span>
          </span>
        </div>`,
    )
    .join("")
  return card("Radius", "A closed scale of three. Tailwind's rounded-xs to -md are control, -lg to -4xl panel.", body)
}

function controlCard(dimension) {
  const names = ["control-dense", "control-form", "control-touch"]
  const uses = { "control-dense": "Tables, filter bars, toolbars: sm and icon-sm", "control-form": "Fields and their actions: default, lg, icon", "control-touch": "Both, under pointer: coarse" }
  const body = names
    .map((name) => {
      const ext = dimension[name].$extensions["com.viglet"]
      const coarse = ext.coarse ? ` · ${ext.coarse.reactNative} px on touch` : ""
      return `
        <div class="control" data-token="--vg-${name}" data-px="${ext.reactNative}" style="display:flex;flex-direction:column;gap:5px">
          <span style="display:flex;align-items:center;height:${ext.reactNative}px;border:1px solid #e5e5e5;border-radius:6px;padding:0 12px;font-size:13px;background:#fafafa">Field at ${ext.reactNative} px</span>
          <span class="mono" style="font-size:11px;color:#1447e6">--vg-${name}</span>
          <span style="font-size:10.5px;color:#696969;margin-top:-3px">${escape(uses[name])}${coarse}</span>
        </div>`
    })
    .join("")
  return card("Control height", "Two heights and a touch step. Every control reads these, never a fixed h-*.", body)
}

/** The whole artboard, for the preset's tokens and Tailwind's type scale. */
export function foundationsReference(preset, theme) {
  const { dimension, font } = tokensJson(preset)
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<!-- Generated by scripts/foundations-reference.mjs from src/styles/preset.css and Tailwind's theme (VDS239). Do not edit: run the script. -->
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@800&family=JetBrains+Mono&display=swap">
  <style>
    body { margin: 0; background: #ffffff; }
    x-dc { display: block; }
    helmet { display: none; }
    .vg { font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
    .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em; }
  </style>
</helmet>

<div class="vg" style="position:relative;width:${WIDTH}px;height:${HEIGHT}px;background:#fafafa;color:#0a0a0a;overflow:hidden;display:flex;flex-direction:column">
  <div style="padding:16px 24px 0">
    <div class="eyebrow" style="color:#1447e6">REFERENCE</div>
    <div style="display:flex;align-items:baseline;gap:12px;margin-top:4px">
      <div style="font-size:21px;font-weight:600;letter-spacing:-0.015em">The foundations</div>
      <div style="font-size:12.5px;color:#696969">Type, radius and control height, read from the tokens and Tailwind's scale. Colour is on grounds and site.</div>
    </div>
  </div>
  <div style="flex:1;min-height:0;display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:16px;padding:14px 24px 20px">${typeCard(typeScale(theme), font)}${radiusCard(dimension)}${controlCard(dimension)}
  </div>
</div>
</x-dc>
</body>
</html>
`
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
export const OUTPUT = join(root, "docs", "reference", "foundations.dc.html")

/** Tailwind's theme stylesheet, from wherever this checkout installed it. */
export function tailwindTheme() {
  return readFileSync(createRequire(import.meta.url).resolve("tailwindcss/theme.css"), "utf8")
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const html = foundationsReference(readFileSync(join(root, "src", "styles", "preset.css"), "utf8"), tailwindTheme())
  if (process.argv.includes("--check")) {
    if (readFileSync(OUTPUT, "utf8") !== html) {
      console.error("foundations-reference: docs/reference/foundations.dc.html is stale; run node scripts/foundations-reference.mjs")
      process.exit(1)
    }
    console.log("foundations-reference: docs/reference/foundations.dc.html matches the tokens")
  } else {
    writeFileSync(OUTPUT, html)
    console.log("foundations-reference: wrote docs/reference/foundations.dc.html")
  }
}
