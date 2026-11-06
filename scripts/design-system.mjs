#!/usr/bin/env node
/**
 * VDS239 — the folder a claude.ai design canvas installs as this design system.
 *
 *   npm run build && node scripts/design-system.mjs [--out design-system] [--by "<name>"]
 *
 * A canvas offers the systems published as "Design System" artifacts and mounts
 * their components by a global name. That artifact keeps its content in files
 * under `project/`, and this writes them, all from what the build already made:
 *
 *   project/tokens.json                 dist/tokens.json, turned into the canvas's
 *                                       list grammar (it cannot read a DTCG map)
 *   project/README.md                   docs/BRAND.md behind a page for designers,
 *                                       with the components from dist/catalogue.json
 *   project/components/bundle.js        dist/viglet-ds.global.js, under its header
 *   project/components/bundle.css       ./styles and bento.css
 *   project/components/<Comp>/…         a guideline and a live preview per component
 *   project/fonts/                      the Latin faces from dist/fonts
 *   project/design-system.json          the index, for a first publish
 *
 * Publishing it is an operator step on a claude.ai account. The published copy is
 * regenerated from here, never edited there: an edit made on the canvas is lost on
 * the next publish.
 */
import { execFileSync } from "node:child_process"
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { tailwindTheme, typeScale } from "./foundations-reference.mjs"
import { GLOBAL_BUILD } from "./lib/global-build.mjs"

export const TITLE = "Viglet Design System"
export const REPO = "openviglet/viglet-design-system"

// ---------------------------------------------------------------------------
// tokens.json, in the canvas's grammar.

/**
 * What each colour is for, by name. Read off the preset's comments, the README's
 * Design Tokens section and where the components use each one; a name none of
 * these covers gets no note rather than an invented one.
 */
const USAGE = [
  [/^background$/, "The page ground."],
  [/^foreground$/, "Body text on the page."],
  [/^card$/, "A card's surface."],
  [/^card-foreground$/, "Text on a card."],
  [/^popover$/, "A popover's or menu's surface."],
  [/^popover-foreground$/, "Text in a popover or menu."],
  [/^primary$/, "\"You are here\": the rail's active marker, focus borders, the default button fill. A product claims it through the --vg-primary-*-base inputs."],
  [/^primary-foreground$/, "Text on the primary fill; holds 4.5:1 on both grounds."],
  [/^secondary$/, "The secondary button's fill."],
  [/^secondary-foreground$/, "Text on the secondary fill."],
  [/^muted$/, "A quiet surface: a card's foot, a hovered row."],
  [/^muted-foreground$/, "Secondary text: hints, meta, captions."],
  [/^accent$/, "A hovered or selected menu item."],
  [/^accent-foreground$/, "Text on a hovered or selected menu item."],
  [/^destructive$/, "Destructive actions and errors. Keeps its hue in every product."],
  [/^border$/, "Hairlines and card borders."],
  [/^input$/, "Field borders."],
  [/^ring$/, "The neutral focus ring."],
  [/^chart-(\d)$/, "Chart series $1."],
  [/^sidebar(-.+)?$/, "The console-era sidebar."],
  [/^bento-tone-(\w+)-(from|to)$/, "A hub tile's chip gradient in the $1 tone, the '$2' stop."],
  [/^bento-(on|warn|error|danger)-mark$/, "The $1 status dot."],
  [/^bento-(on|warn|error|danger)-text(-dark)?(-hover)?$/, "Text in the $1 status."],
  [/^bento-state-(\w+)$/, "The dot beside the word for a $1 record."],
  [/^bento-pulse$/, "The pulse on an unsaved form's dot."],
  [/^accent-(from|to)$/, "The brand accent gradient, '$1' stop. A product re-keys the accent here."],
  [/^accent-text(-dark)?$/, "Accented text, readable on the light ground (-dark: on the dark one)."],
  [/^accent-fg$/, "Accented text, already resolved for the ground. Use this one in a component."],
  [/^accent-surface(-strong)?$/, "The accent's tint behind an icon chip."],
  [/^accent-line$/, "The accent hairline around a chip."],
  [/^accent-fill-(from|to)(-hover)?$/, "The gradient button's fill."],
  [/^accent-ring$/, "The accent focus ring."],
  [/^accent-shadow(-hover)?$/, "The gradient button's glow."],
  [/^brand(-.+)?$/, "The product-site brand palette: badges, links, the call to action."],
  [/^footer-.+$/, "The product-site footer."],
  [/^product-(\w+)$/, "The $1 product mark, and nowhere else."],
]

function usageOf(name) {
  for (const [pattern, note] of USAGE) {
    const match = pattern.exec(name)
    if (match) return note.replace(/\$(\d)/g, (_, i) => match[Number(i)] ?? "")
  }
  return ""
}

/** The colour themes, the cool light ground first, because a missing value inherits the first. */
export function themesOf(json) {
  return Object.keys(json.color).flatMap((tone) =>
    ["light", "dark"].map((ground) => ({
      id: tone === "cool" ? ground : `${tone}-${ground}`,
      name: tone === "cool" ? (ground === "light" ? "Light" : "Dark") : `${tone[0].toUpperCase()}${tone.slice(1)} ${ground}`,
      tone,
      ground,
    })),
  )
}

const quote = (family) => (/[\s]/.test(family) ? `"${family}"` : family)

/**
 * `tokens.json` for the canvas: every family a list of `{name, value, usage}`,
 * colours by theme. Names keep the `vg-` prefix, so the canvas's custom
 * properties are the ones a stylesheet on this package already writes.
 */
export function canvasTokens(json, scale, monoLine, meta) {
  const themes = themesOf(json)
  const names = Object.keys(json.color.cool.light)
  const color = names.map((name) => {
    const value = {}
    for (const theme of themes) {
      const token = json.color[theme.tone][theme.ground][name]
      if (token) value[theme.id] = token.$extensions["com.viglet"].reactNative
    }
    return { name: `vg-${name}`, value, usage: usageOf(name) }
  })

  const px = (name) => `${json.dimension[name].$extensions["com.viglet"].reactNative}px`
  const families = Object.fromEntries(Object.entries(json.font).map(([key, token]) => [key, token.$value.map(quote).join(", ")]))

  return {
    name: TITLE,
    version: 1,
    color: { themes: themes.map(({ id, name }) => ({ id, name })), tokens: color },
    type: {
      fonts: [],
      families,
      groups: [
        {
          name: "Text",
          family: "sans",
          styles: scale.map((s) => ({
            name: `text-${s.step}`,
            fontSize: `${s.size}px`,
            lineHeight: `${s.line}px`,
            fontWeight: s.size >= 16 ? 600 : 400,
            usage: s.role,
          })),
        },
        {
          name: "Mono",
          family: "mono",
          styles: [{ name: "text-mono", fontSize: px("text-mono"), lineHeight: monoLine, fontWeight: 400, usage: "Ids, paths, keys and diffs." }],
        },
      ],
    },
    radius: {
      tokens: [
        { name: "vg-radius-control", value: px("radius-control"), usage: "Buttons, fields, menu items." },
        { name: "vg-radius-panel", value: px("radius-panel"), usage: "Cards, dialogs, popovers, every bento surface." },
        { name: "vg-radius-full", value: px("radius-full"), usage: "Pills, avatars, the state dot." },
      ],
    },
    control: {
      note: "Control heights. Under pointer: coarse both dense and form rise to the touch step.",
      tokens: [
        { name: "vg-control-dense", value: px("control-dense"), usage: "Tables, filter bars, toolbars: the sm and icon-sm sizes." },
        { name: "vg-control-form", value: px("control-form"), usage: "Fields and their actions: the default, lg, icon and icon-lg sizes." },
        { name: "vg-control-touch", value: px("control-touch"), usage: "Both of the above on a touch screen." },
      ],
    },
    meta,
  }
}

// ---------------------------------------------------------------------------
// The components: one guideline and one live preview each.

const h = "const h = React.createElement, ds = window.VigletDS"
const row = (children) => `h("div", { style: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" } }, ${children})`

/** Each component's card: its group, its row height and the states it draws. */
export const PREVIEWS = {
  Button: { group: "Actions", height: 88, body: row(`h(ds.Button, null, "Save"), h(ds.Button, { variant: "outline" }, "Cancel"), h(ds.Button, { variant: "secondary" }, "Duplicate"), h(ds.Button, { variant: "destructive" }, "Delete"), h(ds.Button, { variant: "ghost" }, "More"), h(ds.Button, { loading: true }, "Saving")`) },
  GradientButton: { group: "Actions", height: 88, body: row(`h(ds.GradientButton, null, "Publish"), h(ds.GradientButton, { variant: "outline" }, "Preview"), h(ds.GradientButton, { variant: "ghost" }, "Share")`) },
  Badge: { group: "Status", height: 72, body: row(`h(ds.Badge, null, "New"), h(ds.Badge, { variant: "secondary" }, "Beta"), h(ds.Badge, { variant: "outline" }, "Draft"), h(ds.Badge, { variant: "destructive" }, "Failed")`) },
  BentoStatusMarker: { group: "Status", height: 72, body: row(`...["published", "draft", "scheduled", "changed", "archived"].map((state) => h(ds.BentoStatusMarker, { key: state, state })), h(ds.BentoStatusMarker, { dirty: true }), h(ds.BentoStatusMarker, { titleMissing: true })`) },
  Progress: { group: "Status", height: 72, body: `h("div", { style: { display: "grid", gap: "10px", maxWidth: "360px" } }, h(ds.Progress, { value: 25 }), h(ds.Progress, { value: 70 }))` },
  Input: { group: "Forms", height: 96, body: `h("div", { style: { display: "grid", gap: "10px", maxWidth: "320px" } }, h(ds.Input, { placeholder: "Search areas…" }), h(ds.Input, { defaultValue: "Entity name" }))` },
  Textarea: { group: "Forms", height: 120, body: `h("div", { style: { maxWidth: "360px" } }, h(ds.Textarea, { placeholder: "Description" }))` },
  Checkbox: { group: "Forms", height: 72, body: row(`h("label", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" } }, h(ds.Checkbox, { defaultChecked: true }), "Enabled"), h("label", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" } }, h(ds.Checkbox, null), "Archived")`) },
  Switch: { group: "Forms", height: 72, body: row(`h("label", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" } }, h(ds.Switch, { defaultChecked: true }), "Active"), h("label", { style: { display: "flex", gap: "8px", alignItems: "center", fontSize: "14px" } }, h(ds.Switch, null), "Idle")`) },
  Card: { group: "Layout", height: 200, body: `h(ds.Card, { style: { maxWidth: "360px" } }, h(ds.CardHeader, null, h(ds.CardTitle, null, "Title"), h(ds.CardDescription, null, "One line that says what this holds.")), h(ds.CardContent, null, "The content."), h(ds.CardFooter, null, h(ds.Button, { size: "sm" }, "Open")))` },
  Tabs: { group: "Layout", height: 140, body: `h(ds.Tabs, { defaultValue: "general", style: { maxWidth: "420px" } }, h(ds.TabsList, null, h(ds.TabsTrigger, { value: "general" }, "General"), h(ds.TabsTrigger, { value: "versions" }, "Versions")), h(ds.TabsContent, { value: "general" }, "The general settings."), h(ds.TabsContent, { value: "versions" }, "Every saved version."))` },
  Separator: { group: "Layout", height: 72, body: `h("div", { style: { maxWidth: "360px", fontSize: "14px" } }, "Above", h(ds.Separator, { style: { margin: "10px 0" } }), "Below")` },
  Avatar: { group: "Identity", height: 72, body: row(`h(ds.Avatar, null, h(ds.AvatarFallback, null, "AO")), h(ds.Avatar, null, h(ds.AvatarFallback, null, "VD"))`) },
}

export function previewHtml(name) {
  const card = PREVIEWS[name]
  if (!card) throw new Error(`design-system: no preview for ${name}; add one to PREVIEWS`)
  return `<!-- @dsCard group="${card.group}" height=${card.height} -->
<div id="root" style="padding:16px"></div>
<script>
;(() => {
  ${h}
  ReactDOM.createRoot(document.getElementById("root")).render(${card.body})
})()
</script>
`
}

/** A component's guideline, from its declaration's doc comment and props. */
export function componentReadme(entry) {
  const props = entry.props
    .filter((p) => p.name !== "children" && p.name !== "className")
    .map((p) => `- \`${p.name}${p.optional ? "?" : ""}\`: \`${p.type.replace(/ \| undefined$/, "")}\`${p.summary ? `. ${p.summary}` : ""}`)
  return [
    `# ${entry.name}`,
    "",
    entry.description || entry.summary,
    "",
    `On the canvas it is \`VigletDS.${entry.name}\`; in code, \`import { ${entry.name} } from "${entry.specifier}"\`.`,
    ...(props.length > 0 ? ["", "## Props", "", ...props] : []),
    "",
  ].join("\n")
}

// ---------------------------------------------------------------------------
// The README: a page for designers in front of docs/BRAND.md.

/**
 * BRAND.md without its title, so its two parts sit beside "Designing with it",
 * and with its relative links made absolute: the canvas has no docs/ beside it.
 */
function brandSection(brand, branch) {
  const base = `https://github.com/${REPO}/blob/${branch}/docs/`
  return brand
    .replace(/^# .*\n/, "")
    .replace(/\]\((?!https?:|#)([^)]+)\)/g, (_, path) => `](${base}${path})`)
}

export function designerReadme(brand, entries, { branch, ref }) {
  const rows = entries.map((e) => `| \`${e.name}\` | ${e.summary.replace(/\|/g, "\\|")} |`)
  return `# ${TITLE}

The components and tokens the Viglet products are built from, and that other sites on
the package borrow; the package's \`consumers.json\` lists every one. Generated from
[${REPO}](https://github.com/${REPO}) at \`${ref}\`. An edit made here is lost on the next
publish: change the package instead.

## Designing with it

- **Surfaces.** The page is \`vg-background\`, a card \`vg-card\`, a quiet surface
  \`vg-muted\`. Text is \`vg-foreground\`, and \`vg-muted-foreground\` for hints and meta.
- **The accent** is two stops, \`vg-accent-from\` and \`vg-accent-to\`. The tint, the
  hairline and the button fill derive from them, so a product re-keys the stops and the
  readable pair (\`vg-accent-text\`, \`vg-accent-text-dark\`) and nothing else.
  \`vg-primary\` is the other half: the "you are here" mark and the default button.
- **Tones** re-key the ground under the accent: \`cool\` is the default, \`warm\` is clay
  on a dark-brown ground, \`navy\` the same set in blue. Each is a pair of themes here.
- **State colours** are the only colour on a list: \`vg-bento-state-published\`,
  \`-draft\`, \`-scheduled\`, \`-changed\`, \`-archived\`, drawn as a dot and a word by
  \`BentoStatusMarker\`.
- **Radius and height** are closed scales: \`vg-radius-control\`, \`vg-radius-panel\`,
  \`vg-radius-full\`, and \`vg-control-dense\`, \`vg-control-form\`, \`vg-control-touch\`.

## Which component

| Component | What it is for |
|---|---|
${rows.join("\n")}

${brandSection(brand, branch)}
## Not synced

- Only the components the browser build carries are here; the rest of the package
  (the bento layer's pages, the console chrome) is in code only.
- The previews follow the light and dark themes. The warm and navy themes list their
  values for the pickers; a preview does not switch tone.
- No cover card yet.
`
}

// ---------------------------------------------------------------------------
// The fonts and the index.

/** The Latin faces dist/fonts.css declares, with their weight range. */
export function latinFaces(fontsCss) {
  const faces = []
  for (const [, body] of fontsCss.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const file = /url\(\s*["']?\.\/fonts\/([^"')]+-latin-wght-normal\.woff2)/.exec(body)
    if (!file) continue
    const family = /font-family:\s*['"]?([^;'"]+)/.exec(body)[1]
    const weight = /font-weight:\s*([^;]+);/.exec(body)[1].trim()
    faces.push({ family, file: `fonts/${file[1]}`, weight, style: "normal" })
  }
  return faces
}

export function index({ at, by }) {
  return {
    v: 3,
    layout: "files",
    createdOnFiles: { v: 1, at },
    title: TITLE,
    namespace: GLOBAL_BUILD.name,
    libraries: [
      { name: "react", version: "18" },
      { name: "react-dom", version: "18" },
    ],
    sections: {},
    groups: [],
    assetGroups: {},
    blobs: {},
    docs: { readme: "project/README.md", sections: [] },
    lastChange: { by, at, via: `GitHub · ${REPO}`, note: "Assembled by scripts/design-system.mjs" },
  }
}

// ---------------------------------------------------------------------------
// The folder.

/** Fails on a sequence that would end the element a canvas inlines a file into. */
function inlineSafe(text, file, closing) {
  if (text.includes(closing) || text.includes("<!--")) {
    throw new Error(`design-system: ${file} carries ${closing} or <!--, which would end the element a canvas inlines it into`)
  }
  return text
}

/** Writes `<out>/project/…` from `<root>/dist` and `<root>/docs`. Returns the paths written. */
export function assemble({ root, out, at, by, branch, ref }) {
  const dist = join(root, "dist")
  for (const file of [GLOBAL_BUILD.file, "tokens.json", "catalogue.json", "viglet-design-system.css", "bento.css", "fonts.css"]) {
    if (!existsSync(join(dist, file))) throw new Error(`design-system: dist/${file} is missing; run npm run build first`)
  }
  const project = join(out, "project")
  rmSync(project, { recursive: true, force: true })
  const written = []
  const write = (path, text) => {
    const full = join(project, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, text)
    written.push(path)
  }

  const preset = readFileSync(join(root, "src", "styles", "preset.css"), "utf8")
  const monoLine = /--text-mono--line-height:\s*([\d.]+)rem/.exec(preset)
  const json = JSON.parse(readFileSync(join(dist, "tokens.json"), "utf8"))
  const tokens = canvasTokens(json, typeScale(tailwindTheme()), monoLine ? `${Number(monoLine[1]) * 16}px` : "16px", {
    source: "github",
    repo: REPO,
    ref,
    package: ".",
    paths: { tokens: ["src/styles/preset.css"], fonts: ["dist/fonts"], docs: ["docs/BRAND.md"] },
    synced: at.slice(0, 10),
  })

  const faces = latinFaces(readFileSync(join(dist, "fonts.css"), "utf8"))
  for (const face of faces) {
    mkdirSync(join(project, "fonts"), { recursive: true })
    copyFileSync(join(dist, face.file), join(project, face.file))
    written.push(face.file)
  }
  tokens.type.fonts = faces
  write("tokens.json", JSON.stringify(tokens, null, 2) + "\n")

  const catalogue = JSON.parse(readFileSync(join(dist, "catalogue.json"), "utf8"))
  const entries = GLOBAL_BUILD.components.map((name) => {
    const entry = catalogue.components.find((c) => c.name === name)
    if (!entry) throw new Error(`design-system: ${name} is not in dist/catalogue.json`)
    return entry
  })
  write("README.md", designerReadme(readFileSync(join(root, "docs", "BRAND.md"), "utf8"), entries, { branch, ref }))

  const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: GLOBAL_BUILD.name, components: GLOBAL_BUILD.components.map((name) => ({ name })) })} */`
  write("components/bundle.js", `${header}\n${inlineSafe(readFileSync(join(dist, GLOBAL_BUILD.file), "utf8"), "bundle.js", "</script")}`)
  const css = ["viglet-design-system.css", "bento.css"].map((file) => readFileSync(join(dist, file), "utf8")).join("\n")
  write("components/bundle.css", inlineSafe(css, "bundle.css", "</style"))
  for (const entry of entries) {
    write(`components/${entry.name}/README.md`, componentReadme(entry))
    write(`components/${entry.name}/preview.html`, previewHtml(entry.name))
  }

  write("design-system.json", JSON.stringify(index({ at, by }), null, 2) + "\n")
  return written
}

const git = (root, ...args) => {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim()
  } catch {
    return ""
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
  const args = process.argv.slice(2)
  const flag = (name, fallback) => {
    const at = args.indexOf(name)
    return at === -1 ? fallback : args[at + 1]
  }
  const branch = git(root, "rev-parse", "--abbrev-ref", "HEAD") || "main"
  const out = resolve(root, flag("--out", "design-system"))
  const written = assemble({
    root,
    out,
    at: new Date().toISOString(),
    by: flag("--by", git(root, "config", "user.name") || "Claude"),
    branch,
    ref: `${branch}@${git(root, "rev-parse", "--short", "HEAD") || "unknown"}`,
  })
  console.log(`design-system: ${written.length} files in ${join(out, "project")}`)
}
