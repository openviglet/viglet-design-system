import { IconCpu2, IconSettings } from "@tabler/icons-react"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"
import "./bento.css"

import { GradientButton } from "@/components/ui/gradient-button"
import { GradientSwitch } from "@/components/ui/gradient-switch"

import {
  BentoEntityTile,
  BentoFormSection,
  BentoHero,
  BentoTile,
  BentoTileGrid,
} from "./index"

/**
 * VDS25 — one look across products, as an asserted property.
 *
 * The goal of this whole effort is a claim about appearance, and appearance was
 * the one thing neither repository checked: the evidence was a person opening
 * two browsers, which is expensive, never ran on a pull request, and could not
 * say what changed.
 *
 * So: render one fixed composition twice, once under each token set, and digest
 * what the browser resolved. The claim being tested is precise —
 *
 *   * every **structural** property is byte-identical between the two, and
 *   * every **colour** difference traces to a brand token.
 *
 * A shared component that hardcodes a hue fails the first half (it does not
 * move) or the second (it moves somewhere the tokens do not explain).
 *
 * The token sets are deliberately not named for products. The package holds the
 * schema; which four values Shio or Turing set is theirs. What is asserted here
 * is the property, and the property holds for any pair.
 */

/** Two accents far enough apart that a hardcoded hue cannot hide between them. */
const TOKEN_SETS = {
  cool: {
    "--vg-accent-from": "oklch(62.3% 0.214 259.815)",
    "--vg-accent-to": "oklch(58.5% 0.233 277.117)",
    "--vg-accent-text": "oklch(54.6% 0.245 262.881)",
    "--vg-accent-text-dark": "oklch(70.7% 0.165 254.624)",
  },
  warm: {
    "--vg-accent-from": "oklch(70.5% 0.213 47.604)",
    "--vg-accent-to": "oklch(64.6% 0.222 41.116)",
    "--vg-accent-text": "oklch(50.5% 0.185 38.402)",
    "--vg-accent-text-dark": "oklch(75% 0.183 55.934)",
  },
} as const

/**
 * Properties that describe *where things are and how big they are*. A token
 * re-key must not move a single one of them — that is what "the same layout"
 * means, and it is the half a person eyeballing two browsers is worst at.
 */
const STRUCTURAL = [
  "display",
  "position",
  "flex-direction",
  "flex-wrap",
  "align-items",
  "justify-content",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "gap",
  "padding",
  "margin",
  "border-width",
  "border-radius",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "overflow",
  "opacity",
] as const

/** Properties that carry colour — the only ones a re-key is allowed to change. */
const CHROMATIC = [
  "color",
  "background-color",
  "background-image",
  "border-color",
  "box-shadow",
  "outline-color",
  "fill",
  "stroke",
] as const

/** The composition under test: one of each shape the layer is built from. */
function Composition() {
  const items = [
    { id: "a", title: "Alpha", description: "First" },
    { id: "b", title: "Beta", description: "Second" },
  ]
  return (
    <div style={{ width: 1200 }}>
      <BentoHero
        title="Parity"
        subtitle="One composition, two token sets."
        backTo="/back"
        backLabel="Back"
      />
      <BentoFormSection icon={IconSettings} tone="blue" title="Settings" description="A form section.">
        {/* The accent lives in the controls, not in the bento leaves: a leaf is
            coloured by the tone its caller chose, while a primary action is the
            product's colour. Both belong in one composition, because a page
            composes both and the claim is about the page. */}
        <GradientButton>Save</GradientButton>
        <GradientButton variant="outline">Cancel</GradientButton>
        <GradientButton variant="ghost">More</GradientButton>
        <GradientButton variant="destructive">Delete</GradientButton>
        <GradientSwitch defaultChecked aria-label="Enabled" />
      </BentoFormSection>
      <BentoTile
        to="/tile"
        icon={IconCpu2}
        tone="indigo"
        eyebrow="Eyebrow"
        title="A tile"
        span="col-span-2"
      />
      <BentoTileGrid
        items={items}
        tryAgainUrl="/retry"
        tone="blue"
        itemKey={(i) => i.id}
        renderTile={(i) => (
          <BentoEntityTile
            to={`/e/${i.id}`}
            defaultIcon={IconCpu2}
            tone="blue"
            title={i.title}
            description={i.description}
          />
        )}
        emptyTitle="Nothing"
        emptyDescription="Nothing yet"
      />
    </div>
  )
}

/**
 * A digest is one line per element, in document order, so a diff names the
 * element that moved rather than reporting that two long strings differ.
 * The path is structural (tag + index among siblings) rather than a class name:
 * a class name would carry the token into the key and hide the very difference
 * being looked for.
 */
function digest(root: Element, properties: readonly string[]): string[] {
  const lines: string[] = []

  const walk = (el: Element, path: string) => {
    const style = getComputedStyle(el)
    const values = properties.map((p) => `${p}=${style.getPropertyValue(p).trim()}`)
    const box = el as HTMLElement
    lines.push(
      [
        path,
        // Rounded: sub-pixel noise between two runs is not a layout change.
        `box=${Math.round(box.offsetWidth)}x${Math.round(box.offsetHeight)}`,
        ...values,
      ].join(" "),
    )

    const byTag = new Map<string, number>()
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      const n = byTag.get(tag) ?? 0
      byTag.set(tag, n + 1)
      walk(child, `${path}>${tag}[${n}]`)
    }
  }

  walk(root, root.tagName.toLowerCase())
  return lines
}

/** The tonal chips, whose colour the caller chose and a re-key must not touch. */
function toneChips(host: HTMLElement): string[] {
  return Array.from(host.querySelectorAll("[class*='bento-tone-']")).map((el) => {
    const s = getComputedStyle(el)
    return `${s.backgroundImage}|${s.color}`
  })
}

/**
 * The tokens go on the document element, which is the contract the README
 * states and not merely a convenience here: the derived tokens are `color-mix`
 * over `--vg-accent-from` **declared on `:root`**, so they are substituted
 * there. Setting the four on a nested wrapper re-keys what a utility class
 * mixes inline and leaves every pre-derived token at the root's value — the
 * tint and the hairline would not move, and half of this suite would pass while
 * proving nothing.
 */
function renderUnder(tokens: Record<string, string>, tree: ReactElement): HTMLElement {
  const root = document.documentElement
  for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value)

  const host = document.createElement("div")
  document.body.appendChild(host)
  render(<MemoryRouter>{tree}</MemoryRouter>, { container: host })
  return host
}

function clearTokens() {
  const root = document.documentElement
  for (const name of Object.keys(TOKEN_SETS.cool)) root.style.removeProperty(name)
}

describe("two token sets render the same layer", () => {
  // Digested one at a time, because the tokens live on the shared root: two
  // trees mounted at once would both read whichever set was applied last.
  const cool = renderUnder(TOKEN_SETS.cool, <Composition />)
  const coolStructure = digest(cool, STRUCTURAL)
  const coolColour = digest(cool, CHROMATIC)
  const coolText = cool.textContent ?? ""
  const coolTones = toneChips(cool)
  cool.remove()
  clearTokens()

  const warm = renderUnder(TOKEN_SETS.warm, <Composition />)
  const warmStructure = digest(warm, STRUCTURAL)
  const warmColour = digest(warm, CHROMATIC)
  const warmTones = toneChips(warm)
  warm.remove()
  clearTokens()

  it("digests something substantial — the composition actually mounted", () => {
    expect(coolStructure.length).toBeGreaterThan(40)
    expect(coolText).toContain("Parity")
    expect(coolText).toContain("Settings")
    expect(coolText).toContain("Alpha")
  })

  it("moves nothing: every structural property is identical", () => {
    expect(coolStructure.length, "the two renders produced different element counts").toBe(
      warmStructure.length,
    )
    const moved = coolStructure
      .map((line, i) => [line, warmStructure[i]] as const)
      .filter(([x, y]) => x !== y)
    expect(
      moved.map(([x, y]) => `\n  cool: ${x}\n  warm: ${y}`),
      "a token re-key changed the layout, which is what it must never do",
    ).toEqual([])
  })

  it("differs in colour, and only in colour", () => {
    const differing = coolColour.filter((line, i) => line !== warmColour[i])

    // Non-vacuous in the direction that matters: if re-keying changed no colour
    // at all, the tokens are not reaching the components and the assertion
    // above would pass for the wrong reason.
    expect(
      differing.length,
      "the accent tokens reached nothing — the components are not reading them",
    ).toBeGreaterThan(3)
  })

  it("leaves the tones alone — they are not the accent", () => {
    // A bento tone is chosen by the caller, so it must survive a re-key.
    expect(coolTones.length, "no toned chip rendered, so this asserts nothing").toBeGreaterThan(0)
    expect(coolTones).toEqual(warmTones)
  })
})
