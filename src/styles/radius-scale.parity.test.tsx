import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"
import "@/bento/bento.css"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

/**
 * VDS198 — the closed radius scale, measured where a radius resolves.
 *
 * The radius keys were arithmetic on --vg-radius and the bento surfaces added
 * 16 and 24 px of their own, so Shio's console counted ten radii. Every key now
 * lands on a control or a panel token, which jsdom cannot show: it would hand
 * back `rounded-2xl` whether or not the key had moved.
 */

const CONTROL = "6px"
const PANEL = "10px"

function radiusOf(className: string) {
  const host = document.createElement("div")
  host.className = className
  document.body.appendChild(host)
  const radius = getComputedStyle(host).borderTopLeftRadius
  host.remove()
  return radius
}

function renderedRadius(element: React.ReactElement, selector: string) {
  const { container, unmount } = render(element)
  const radius = getComputedStyle(container.querySelector(selector)!).borderTopLeftRadius
  unmount()
  return radius
}

describe("every radius key lands on the closed scale", () => {
  it.each(["rounded-xs", "rounded-sm", "rounded-md"])("%s is the control radius", (key) => {
    expect(radiusOf(key)).toBe(CONTROL)
  })

  it.each(["rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-4xl"])(
    "%s is the panel radius",
    (key) => {
      expect(radiusOf(key)).toBe(PANEL)
    },
  )

  it("keeps rounded-full a pill", () => {
    expect(Number.parseFloat(radiusOf("rounded-full"))).toBeGreaterThan(1000)
  })

  it("draws the bento tile and its dropdown as panels and a menu item as a control", () => {
    expect(radiusOf("bento-tile")).toBe(PANEL)
    expect(radiusOf("bento-dropdown")).toBe(PANEL)
    expect(radiusOf("bento-dropdown-item")).toBe(CONTROL)
  })

  it("draws the controls as controls, a card as a panel and a badge as a pill", () => {
    expect(renderedRadius(<Button>Save</Button>, "button")).toBe(CONTROL)
    expect(renderedRadius(<Input aria-label="Name" />, "input")).toBe(CONTROL)
    expect(renderedRadius(<Card>Body</Card>, "[data-slot=card]")).toBe(PANEL)
    expect(Number.parseFloat(renderedRadius(<Badge>New</Badge>, "[data-slot=badge]"))).toBeGreaterThan(1000)
  })
})
