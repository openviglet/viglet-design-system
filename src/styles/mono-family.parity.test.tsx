import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"
import "@/components/ui/floating-formulas-bg.css"

import { BentoDiff } from "@/bento/bento-diff"

/**
 * VDS199 — one monospace family, measured where a font resolves.
 *
 * `font-mono` fell to the browser's stack, the formulas backdrop named its own
 * pair and the diff took whatever `font-mono` gave it, so Shio's console counted
 * three monos. Each now resolves to --vg-font-mono, which jsdom cannot show.
 */

function familyOf(className: string, tag = "div") {
  const host = document.createElement(tag)
  if (className) host.className = className
  document.body.appendChild(host)
  const family = getComputedStyle(host).fontFamily
  host.remove()
  return family
}

describe("every mono in the package is the one stack", () => {
  const stack = () => familyOf("font-mono")

  it("starts font-mono at the named face and falls to the platform mono", () => {
    expect(stack()).toMatch(/^"JetBrains Mono", ui-monospace/)
  })

  it("gives code and the formulas backdrop the same stack", () => {
    expect(familyOf("", "code")).toBe(stack())
    expect(familyOf("ff-term")).toBe(stack())
  })

  it("renders a diff's rows in it, at the 12 px mono step", () => {
    const { container, unmount } = render(
      <BentoDiff
        before={{ body: "a\nb" }}
        after={{ body: "a\nc" }}
        fields={[{ id: "body", label: "Body", kind: "lines" }]}
      />,
    )
    const table = getComputedStyle(container.querySelector("table")!)
    expect(table.fontFamily).toBe(stack())
    expect(table.fontSize).toBe("12px")
    unmount()
  })
})
