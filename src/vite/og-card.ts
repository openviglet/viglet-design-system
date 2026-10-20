import { writeFileSync } from "node:fs"

/**
 * A tone's dark ground as the social card draws it. Hex, because resvg reads no
 * `oklch()`; `og-card.test.ts` holds each value to the preset token it stands
 * for, so a change to the tone that is not made here fails a test.
 */
export const OG_CARD_TONES = {
  cool: {
    background: "#171717",
    foreground: "#dedede",
    muted: "#aeaeae",
    brand: "#f97316",
    gradient: ["#f97316", "#fdba74"],
  },
  warm: {
    background: "#15100c",
    foreground: "#f4ece4",
    muted: "#b6a596",
    brand: "#d97757",
    gradient: ["#d97757", "#e9a33a"],
  },
} as const

export type OgCardTone = keyof typeof OG_CARD_TONES

export interface OgCardOptions {
  /** The headline, one string per line: an SVG text does not wrap. */
  title: string | readonly string[]
  /** A last headline line drawn in the tone's gradient. */
  titleAccent?: string
  /** The supporting line or lines under the headline. */
  line?: string | readonly string[]
  /** The small capitals above the headline. */
  eyebrow?: string
  /** The product's mark, as SVG source; its children are placed by height at the top left. */
  mark?: string
  tone?: OgCardTone
  /** The highlight: the eyebrow and the glow. Defaults to the tone's brand. */
  accent?: string
  fontFamily?: string
}

export const OG_CARD_WIDTH = 1200
export const OG_CARD_HEIGHT = 630

const LEFT = 90
const MARK = { top: 80, height: 120 }

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

const lines = (value: string | readonly string[] | undefined): readonly string[] =>
  value === undefined ? [] : typeof value === "string" ? [value] : value

/**
 * The mark's artwork, placed by height. Its own root `<svg>` cannot come along:
 * a nested svg brings its own viewport and re-fits the art to a box this did
 * not choose. Its children can.
 */
function placeMark(source: string): string {
  const viewBox = /\bviewBox="([\d.\-\s]+)"/.exec(source)
  if (!viewBox) throw new Error("og-card: the mark has no viewBox, so it cannot be sized")
  const [minX, minY, , boxHeight] = viewBox[1].trim().split(/\s+/).map(Number)
  const artwork = source.replace(/^[\s\S]*?<svg\b[^>]*>/, "").replace(/<\/svg>\s*$/, "").trim()
  const scale = MARK.height / boxHeight
  return `<g transform="translate(${LEFT - minX * scale},${MARK.top - minY * scale}) scale(${scale.toFixed(6)})">${artwork}</g>`
}

/**
 * The social card as SVG, 1200 by 630, in a tone's dark ground (VDS215). A pure
 * function, so a site can inspect or adjust the markup before `renderOgCard`
 * rasterises it.
 */
export function ogCardSvg(options: OgCardOptions): string {
  const palette = OG_CARD_TONES[options.tone ?? "warm"]
  const accent = options.accent ?? palette.brand
  const font = escapeXml(options.fontFamily ?? "DejaVu Sans")
  const heading = [...lines(options.title)]
  const supporting = lines(options.line)

  const titleSize = 68
  const titleLead = 82
  const rows = heading.length + (options.titleAccent ? 1 : 0)
  // The block sits on the lower two thirds and grows upward, so a long headline
  // pushes the eyebrow up instead of pushing the line off the card.
  const lineTop = OG_CARD_HEIGHT - 90 - (supporting.length - 1) * 42
  const titleBottom = supporting.length > 0 ? lineTop - 58 : OG_CARD_HEIGHT - 110
  const titleTop = titleBottom - (rows - 1) * titleLead

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" viewBox="0 0 ${OG_CARD_WIDTH} ${OG_CARD_HEIGHT}">`,
    "<defs>",
    `<linearGradient id="vg-og-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.gradient[0]}"/><stop offset="1" stop-color="${palette.gradient[1]}"/></linearGradient>`,
    `<radialGradient id="vg-og-glow" cx="0.85" cy="0" r="0.75"><stop offset="0" stop-color="${escapeXml(accent)}" stop-opacity="0.28"/><stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity="0"/></radialGradient>`,
    "</defs>",
    `<rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="${palette.background}"/>`,
    `<rect width="${OG_CARD_WIDTH}" height="${OG_CARD_HEIGHT}" fill="url(#vg-og-glow)"/>`,
  ]
  if (options.mark) parts.push(placeMark(options.mark))
  if (options.eyebrow) {
    parts.push(
      `<text x="${LEFT}" y="${titleTop - titleSize - 14}" fill="${escapeXml(accent)}" font-family="${font}" font-size="24" font-weight="700" letter-spacing="3">${escapeXml(options.eyebrow.toUpperCase())}</text>`,
    )
  }
  heading.forEach((text, i) => {
    parts.push(
      `<text x="${LEFT}" y="${titleTop + i * titleLead}" fill="${palette.foreground}" font-family="${font}" font-size="${titleSize}" font-weight="800">${escapeXml(text)}</text>`,
    )
  })
  if (options.titleAccent) {
    parts.push(
      `<text x="${LEFT}" y="${titleBottom}" fill="url(#vg-og-grad)" font-family="${font}" font-size="${titleSize}" font-weight="800">${escapeXml(options.titleAccent)}</text>`,
    )
  }
  supporting.forEach((text, i) => {
    parts.push(
      `<text x="${LEFT}" y="${lineTop + i * 42}" fill="${palette.muted}" font-family="${font}" font-size="30">${escapeXml(text)}</text>`,
    )
  })
  parts.push(`<rect y="${OG_CARD_HEIGHT - 10}" width="${OG_CARD_WIDTH}" height="10" fill="url(#vg-og-grad)"/>`, "</svg>")
  return parts.join("\n")
}

/**
 * Rasterises a card to PNG at 1200 by 630 and writes it to `out`, refusing any
 * other size: an og:image that is not the size its tags declare is cropped or
 * letterboxed by whoever renders the link.
 *
 * `@resvg/resvg-js` is an optional peer, imported here and nowhere else, so a
 * site that draws no card installs no native binary. System fonts are loaded so
 * the card's text renders with what the build machine has.
 */
export async function renderOgCard({
  svg,
  out,
  fontFamily = "DejaVu Sans",
}: {
  svg: string
  out: string
  fontFamily?: string
}): Promise<{ width: number; height: number; bytes: number }> {
  let resvg: typeof import("@resvg/resvg-js")
  try {
    resvg = await import("@resvg/resvg-js")
  } catch {
    throw new Error("og-card: renderOgCard needs @resvg/resvg-js; add it to the site's devDependencies")
  }
  const image = new resvg.Resvg(svg, {
    fitTo: { mode: "width", value: OG_CARD_WIDTH },
    font: { loadSystemFonts: true, defaultFontFamily: fontFamily },
  }).render()
  if (image.width !== OG_CARD_WIDTH || image.height !== OG_CARD_HEIGHT) {
    throw new Error(`og-card: expected ${OG_CARD_WIDTH}x${OG_CARD_HEIGHT}, got ${image.width}x${image.height}`)
  }
  const png = image.asPng()
  writeFileSync(out, png)
  return { width: image.width, height: image.height, bytes: png.length }
}
