#!/usr/bin/env node
/**
 * VDS218 — the product-site reference artboard, drawn from the tokens.
 *
 *   node scripts/site-reference.mjs           # write docs/reference/site.dc.html
 *   node scripts/site-reference.mjs --check   # fail when the committed page is stale
 *
 * The other artboards state resolved values typed in by hand, and VDS99 found
 * one still printing a ratio the package had stopped shipping. This one is
 * generated: every colour on it is a token resolved for its tone and ground,
 * and every ratio printed under it is measured by `scripts/lib/contrast.mjs`,
 * the arithmetic the contrast gate runs. A ratio under 4.5:1 is marked on the
 * page itself, so a tone that fails is visible where it is drawn.
 */
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { AA_TEXT, groundTokens, hex, luminance, over, parseColour, ratio } from "./lib/contrast.mjs"

export const WIDTH = 1280
export const HEIGHT = 940

/**
 * Three accents a product card might carry: the package's own, and two a product
 * re-keys to. Each has its readable pair per ground, as a re-key states it.
 */
const ACCENTS = [
  { name: "Package accent", light: "var(--vg-accent-text)", dark: "var(--vg-accent-text-dark)" },
  { name: "Green re-key", light: "oklch(50.8% 0.118 165.612)", dark: "oklch(76.5% 0.177 163.223)" },
  { name: "Amber re-key", light: "oklch(55.5% 0.163 48.998)", dark: "oklch(82.8% 0.189 84.429)" },
]

const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/** One tone on one ground: its resolved colours and the ratios a site page depends on. */
export function measureCell(preset, tone, ground) {
  const { tokens } = groundTokens([{ name: "preset.css", css: preset }], ground, tone)
  const colour = (value) => parseColour(value, tokens)
  const token = (name) => colour(tokens.get(name) ?? "")
  const page = token("--vg-background")
  const opaque = (c) => (c && c.alpha < 1 ? over(c, page) : c)
  const paint = (name) => {
    const resolved = opaque(token(name))
    if (!resolved) throw new Error(`site-reference: ${name} does not resolve on ${tone} ${ground}`)
    return hex(resolved)
  }
  const measure = (label, front, behind, text) => {
    const value = ratio(luminance(opaque(front)), luminance(opaque(behind)))
    return { label, value: Math.round(value * 100) / 100, fails: value < AA_TEXT, text }
  }

  const accents = ACCENTS.map((accent) => {
    const text = colour(ground === "dark" ? accent.dark : accent.light)
    return { name: accent.name, colour: hex(opaque(text)), ratio: measure(`${accent.name} on a card`, text, token("--vg-card"), true) }
  })
  const gradient = (tokens.get("--vg-gradient") ?? "").match(/#[0-9a-f]{6}/gi) ?? []

  return {
    tone,
    ground,
    colours: {
      background: paint("--vg-background"),
      foreground: paint("--vg-foreground"),
      muted: paint("--vg-muted-foreground"),
      card: paint("--vg-card"),
      surface: paint("--vg-muted"),
      border: paint("--vg-border"),
      brand: paint("--vg-brand"),
      brandBg: paint("--vg-brand-bg"),
      brandBorder: paint("--vg-brand-border"),
      gradient,
    },
    face: tone === "warm" ? "Inter" : "Plus Jakarta Sans",
    accents,
    ratios: [
      measure("Body on the page", token("--vg-foreground"), page, true),
      measure("Muted on the page", token("--vg-muted-foreground"), page, true),
      measure("Muted on a card's foot", token("--vg-muted-foreground"), token("--vg-muted"), true),
      measure("Brand on the page", token("--vg-brand"), page, true),
      measure("Badge on its tint", token("--vg-brand"), token("--vg-brand-bg"), true),
    ],
  }
}

const chip = ({ value, fails }) =>
  `<span class="ratio ${fails ? "fail" : "pass"}" data-ratio="${value.toFixed(2)}">${value.toFixed(2)}:1${fails ? " · under AA" : ""}</span>`

function cell(m) {
  const c = m.colours
  const grad = c.gradient.length >= 2 ? `linear-gradient(120deg,${c.gradient[0]},${c.gradient[c.gradient.length - 1]})` : c.brand
  const cards = m.accents
    .map(
      (a) => `
        <div style="flex:1;border:1px solid ${c.border};border-radius:10px;padding:10px;background:linear-gradient(180deg,${c.card},${c.surface})">
          <div style="display:flex;align-items:center;gap:6px"><span style="width:7px;height:7px;border-radius:50%;background:${a.colour}"></span><span style="font-size:11px;font-weight:700;color:${a.colour}">${escape(a.name)}</span></div>
          <div style="font-size:10.5px;color:${c.muted};margin:4px 0 6px;line-height:1.4">A depth page, in one line.</div>
          ${chip(a.ratio)}
        </div>`,
    )
    .join("")
  const ratios = m.ratios
    .map((r) => `<div style="display:flex;align-items:center;gap:7px">${chip(r)}<span style="font-size:10px;color:${c.muted}">${escape(r.label)}</span></div>`)
    .join("")

  return `
    <div class="cell" data-tone="${m.tone}" data-ground="${m.ground}" style="border:1px solid ${c.border};border-radius:14px;background:${c.background};color:${c.foreground};padding:14px;display:flex;flex-direction:column;gap:10px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:9px">
        <span class="eyebrow" style="color:${c.muted}">${m.tone.toUpperCase()} · ${m.ground.toUpperCase()}</span>
        <span class="mono" style="font-size:10px;color:${c.muted}">--vg-background ${c.background}</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px;border-bottom:1px solid ${c.border};padding-bottom:8px">
        <span style="font-family:'${m.face}',sans-serif;font-weight:800;font-size:13px">Product name</span>
        <span style="flex:1"></span>
        <span style="font-size:11px;color:${c.muted}">Section</span>
        <span style="font-size:11px;font-weight:600;color:#fff;padding:5px 10px;border-radius:6px;background:${grad}">Call to action</span>
      </div>
      <div style="text-align:center">
        <span style="display:inline-block;font-size:10px;font-weight:600;padding:3px 10px;border-radius:999px;background:${c.brandBg};border:1px solid ${c.brandBorder};color:${c.brand}">Badge</span>
        <div style="font-family:'${m.face}',sans-serif;font-size:24px;font-weight:900;letter-spacing:-0.03em;line-height:1.1;margin-top:8px">Says what it does,<br><span style="background:${grad};-webkit-background-clip:text;background-clip:text;color:transparent">in one line.</span></div>
        <div style="font-size:11.5px;color:${c.muted};margin-top:6px">The lead sentence, in muted text on the page.</div>
      </div>
      <div style="display:flex;gap:8px">${cards}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 12px">${ratios}</div>
      <div style="border-top:1px solid ${c.border};padding-top:8px;display:flex;gap:10px;align-items:center">
        <span style="width:22px;height:22px;border-radius:6px;background:#fff;border:1px solid ${c.border}"></span>
        <span style="font-size:9px;letter-spacing:0.08em;color:${c.muted}">SPONSORED BY</span>
        <span style="font-size:11.5px;font-weight:800">Sponsor name</span>
        <span style="font-size:10px;color:${c.muted}">One line of the sponsor's summary.</span>
      </div>
    </div>`
}

/** The whole artboard, for the preset's current tokens. */
export function siteReference(preset) {
  const cells = ["cool", "warm"].flatMap((tone) => ["light", "dark"].map((ground) => measureCell(preset, tone, ground)))
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<!-- Generated by scripts/site-reference.mjs from src/styles/preset.css (VDS218). Do not edit: run the script. -->
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@800&display=swap">
  <style>
    body { margin: 0; background: #ffffff; }
    x-dc { display: block; }
    helmet { display: none; }
    .vg { font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; -webkit-font-smoothing: antialiased; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .eyebrow { font-size: 10.5px; font-weight: 600; letter-spacing: 0.09em; }
    .ratio { display: inline-flex; align-items: center; height: 18px; padding: 0 7px; border-radius: 5px; font-size: 9.5px; font-weight: 700; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .pass { border: 1px solid rgba(0,188,125,0.4); background: rgba(0,188,125,0.12); color: #00a36c; }
    .fail { border: 1px solid rgba(231,0,11,0.5); background: rgba(231,0,11,0.12); color: #e7000b; }
  </style>
</helmet>

<div class="vg" style="position:relative;width:${WIDTH}px;height:${HEIGHT}px;background:#fafafa;color:#0a0a0a;overflow:hidden;display:flex;flex-direction:column">
  <div style="padding:16px 24px 0">
    <div class="eyebrow" style="color:#1447e6">REFERENCE</div>
    <div style="display:flex;align-items:baseline;gap:12px;margin-top:4px">
      <div style="font-size:21px;font-weight:600;letter-spacing:-0.015em">A product site on both tones and both grounds</div>
      <div style="font-size:12.5px;color:#696969">Every colour is a token and every ratio is measured from it. Red marks a pair under 4.5:1.</div>
    </div>
  </div>
  <div style="flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px;padding:14px 24px 20px">${cells.map(cell).join("")}
  </div>
</div>
</x-dc>
</body>
</html>
`
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
export const OUTPUT = join(root, "docs", "reference", "site.dc.html")

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const html = siteReference(readFileSync(join(root, "src", "styles", "preset.css"), "utf8"))
  if (process.argv.includes("--check")) {
    if (readFileSync(OUTPUT, "utf8") !== html) {
      console.error("site-reference: docs/reference/site.dc.html is stale; run node scripts/site-reference.mjs")
      process.exit(1)
    }
    console.log("site-reference: docs/reference/site.dc.html matches the tokens")
  } else {
    writeFileSync(OUTPUT, html)
    console.log("site-reference: wrote docs/reference/site.dc.html")
  }
}
