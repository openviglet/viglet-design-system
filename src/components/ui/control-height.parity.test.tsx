import { IconTrash } from "@tabler/icons-react"
import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"

import { BentoActionsMenu } from "@/bento/bento-actions-menu"

import { Button } from "./button"
import { GradientButton } from "./gradient-button"
import { Input } from "./input"
import { Select, SelectTrigger, SelectValue } from "./select"
import { Toggle } from "./toggle"

/**
 * VDS197 — a closed control-height scale, measured where a height resolves.
 *
 * Button, Input and Select spanned three heights and GradientButton three more,
 * and Shio's console counted fifteen. The scale is two heights and a touch step,
 * as tokens in preset.css, so the claim is every exported control's laid-out
 * height and not its class name: jsdom would hand back `h-(--vg-control-form)`
 * whether or not the token existed.
 */

/** Dense and form at a fine pointer. The touch step is the coarse pointer's. */
const SCALE = [32, 36]

const CONTROLS: Record<string, ReactElement> = {
  "Button default": <Button>Save</Button>,
  "Button sm": <Button size="sm">Save</Button>,
  "Button lg": <Button size="lg">Save</Button>,
  "Button icon": <Button size="icon" aria-label="Add" />,
  "Button icon-sm": <Button size="icon-sm" aria-label="Add" />,
  "Button icon-lg": <Button size="icon-lg" aria-label="Add" />,
  "GradientButton default": <GradientButton>Save</GradientButton>,
  "GradientButton sm": <GradientButton size="sm">Save</GradientButton>,
  "GradientButton lg": <GradientButton size="lg">Save</GradientButton>,
  "GradientButton icon": <GradientButton size="icon" aria-label="Add" />,
  "GradientButton icon-sm": <GradientButton size="icon-sm" aria-label="Add" />,
  "GradientButton icon-lg": <GradientButton size="icon-lg" aria-label="Add" />,
  "Toggle default": <Toggle aria-label="Bold">B</Toggle>,
  "Toggle sm": <Toggle size="sm" aria-label="Bold">B</Toggle>,
  "Toggle lg": <Toggle size="lg" aria-label="Bold">B</Toggle>,
  Input: <Input aria-label="Name" />,
  "SelectTrigger default": (
    <Select>
      <SelectTrigger aria-label="Locale"><SelectValue placeholder="Locale" /></SelectTrigger>
    </Select>
  ),
  "SelectTrigger sm": (
    <Select>
      <SelectTrigger size="sm" aria-label="Locale"><SelectValue placeholder="Locale" /></SelectTrigger>
    </Select>
  ),
  "BentoActionsMenu trigger": (
    <BentoActionsMenu
      triggerLabel="More"
      actions={[{ id: "post.delete", label: "Delete", icon: IconTrash, onSelect: () => {} }]}
    />
  ),
}

function heightOf(control: ReactElement) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const { unmount } = render(control, { container: host })
  const element = host.querySelector("button, input")!
  const height = element.getBoundingClientRect().height
  unmount()
  host.remove()
  return height
}

describe("every exported control sits on the closed height scale", () => {
  for (const [name, control] of Object.entries(CONTROLS)) {
    it(`${name} is dense or form`, () => {
      expect(SCALE).toContain(heightOf(control))
    })
  }

  it("draws both heights, so the scale is not one value", () => {
    const heights = new Set(Object.values(CONTROLS).map(heightOf))
    expect([...heights].sort((a, b) => a - b)).toEqual(SCALE)
  })

  it("raises both heights to the touch step under a coarse pointer", () => {
    const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules])
    const coarse = rules.filter(
      (rule): rule is CSSMediaRule =>
        rule instanceof CSSMediaRule && rule.conditionText.includes("pointer: coarse"),
    )
    const text = coarse.map((rule) => rule.cssText).join("\n")
    expect(text).toContain("--vg-control-dense: var(--vg-control-touch)")
    expect(text).toContain("--vg-control-form: var(--vg-control-touch)")
    expect(getComputedStyle(document.documentElement).getPropertyValue("--vg-control-touch").trim()).toBe("2.75rem")
  })
})
