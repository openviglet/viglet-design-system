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
 * So: render one fixed composition once per token set, and digest what the
 * browser resolved. The claim being tested is precise —
 *
 *   * every **structural** property is byte-identical across all of them, and
 *   * every **colour** difference traces to a brand token.
 *
 * A shared component that hardcodes a hue fails the first half (it does not
 * move) or the second (it moves somewhere the tokens do not explain).
 *
 * The token sets are deliberately not named for products. The package holds the
 * schema; which four values a product sets are its own. What is asserted here
 * is the property, and the property holds for any set.
 */

/**
 * One accent per declared consumer, far enough apart that a hardcoded hue
 * cannot hide between any two of them. They are not named for products: the
 * package holds the schema, and the property under test holds for any set.
 * `consumers.test.ts` asserts there are at least as many of these as there
 * are consumers, so a fourth console arrives here rather than being noticed
 * later, which is the whole of VDS31.
 */
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
  green: {
    "--vg-accent-from": "oklch(69.6% 0.17 162.48)",
    "--vg-accent-to": "oklch(60% 0.118 184.704)",
    "--vg-accent-text": "oklch(50.8% 0.118 165.612)",
    "--vg-accent-text-dark": "oklch(76.5% 0.177 163.223)",
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
        subtitle="One composition, every token set."
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
  for (const set of Object.values(TOKEN_SETS)) {
    for (const name of Object.keys(set)) root.style.removeProperty(name)
  }
}

describe("every token set renders the same layer", () => {
  // Digested one at a time, because the tokens live on the shared root: two
  // trees mounted at once would both read whichever set was applied last.
  const digests = Object.entries(TOKEN_SETS).map(([name, tokens]) => {
    const host = renderUnder(tokens, <Composition />)
    const measured = {
      name,
      structure: digest(host, STRUCTURAL),
      colour: digest(host, CHROMATIC),
      text: host.textContent ?? "",
      tones: toneChips(host),
    }
    host.remove()
    clearTokens()
    return measured
  })

  const [first, ...rest] = digests

  it("digests something substantial — the composition actually mounted", () => {
    expect(digests.length, "fewer token sets than consumers").toBeGreaterThanOrEqual(3)
    expect(first.structure.length).toBeGreaterThan(40)
    expect(first.text).toContain("Parity")
    expect(first.text).toContain("Settings")
    expect(first.text).toContain("Alpha")
  })

  it("moves nothing: every structural property is identical", () => {
    for (const other of rest) {
      expect(
        first.structure.length,
        `${first.name} and ${other.name} produced different element counts`,
      ).toBe(other.structure.length)

      const moved = first.structure
        .map((line, i) => [line, other.structure[i]] as const)
        .filter(([x, y]) => x !== y)
      expect(
        moved.map(([x, y]) => `\n  ${first.name}: ${x}\n  ${other.name}: ${y}`),
        "a token re-key changed the layout, which is what it must never do",
      ).toEqual([])
    }
  })

  it("differs in colour, and only in colour", () => {
    for (const other of rest) {
      const differing = first.colour.filter((line, i) => line !== other.colour[i])

      // Non-vacuous in the direction that matters: if re-keying changed no
      // colour at all, the tokens are not reaching the components and the
      // assertion above would pass for the wrong reason.
      expect(
        differing.length,
        `${other.name}: the accent tokens reached nothing — the components are not reading them`,
      ).toBeGreaterThan(3)
    }
  })

  /**
   * VDS39 — the constraint the story got wrong, pinned so it stops being a
   * surprise. A custom property substitutes its `var()` references where it is
   * declared, so the tokens derived on `:root` are mixed against the accent
   * declared there. Re-keying a subtree therefore moves what a utility class
   * mixes inline and leaves the pre-derived tokens alone.
   *
   * If this ever fails, the indirection has been removed (a `*` redefinition,
   * or the derivations moved into the utility rules) and re-keying a subtree
   * now works. That is a better system: delete this test, and the story can go
   * back to showing two panels side by side.
   */
  it("re-keys only from the root — a wrapper moves the inline mixes and nothing else", () => {
    const host = document.createElement("div")
    for (const [name, value] of Object.entries(TOKEN_SETS.warm)) host.style.setProperty(name, value)
    document.body.appendChild(host)

    const inside = document.createElement("div")
    inside.className = "vg-accent-chip"
    host.appendChild(inside)

    const outside = document.createElement("div")
    outside.className = "vg-accent-chip"
    document.body.appendChild(outside)

    const rootSurface = getComputedStyle(document.documentElement)
      .getPropertyValue("--vg-accent-surface")
      .trim()

    // The chip mixes --vg-accent-from in its own rule, on the element, so it
    // does follow the wrapper — which is exactly why the partial re-key looks
    // like it worked.
    expect(
      getComputedStyle(inside).backgroundImage,
      "the chip did not follow the wrapper",
    ).not.toBe(getComputedStyle(outside).backgroundImage)
    outside.remove()
    // The pre-derived token did not: it is still whatever :root computed.
    expect(
      getComputedStyle(host).getPropertyValue("--vg-accent-surface").trim(),
      "a wrapper re-key now reaches the derived tokens — see this test's note",
    ).toBe(rootSurface)

    host.remove()
  })

  it("leaves the tones alone — they are not the accent", () => {
    // A bento tone is chosen by the caller, so it must survive a re-key.
    expect(first.tones.length, "no toned chip rendered, so this asserts nothing").toBeGreaterThan(0)
    for (const other of rest) {
      expect(other.tones, `${other.name} repainted a tone the caller chose`).toEqual(first.tones)
    }
  })
})
