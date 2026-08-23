import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it } from "vitest"

import {
  BreadcrumbProvider,
  type BreadcrumbItem,
  useBreadcrumb,
} from "@/contexts/breadcrumb.context"

import { useSubPageBreadcrumb } from "./use-sub-page-breadcrumb"

// VDS66 — the insertion path guarded against restating the crumb above by
// comparing the first item and then returning the breadcrumb untouched, so a
// sub-page restating its parent lost every level behind the repeat. That is the
// hook's own documented two-level example.

function Crumbs() {
  const { items } = useBreadcrumb()
  return <div data-testid="crumbs">{items.map((i) => i.label).join(" / ")}</div>
}

function Level({
  items,
}: {
  readonly items: string | BreadcrumbItem | BreadcrumbItem[] | undefined
}) {
  useSubPageBreadcrumb(items)
  return null
}

const draw = (ui: ReactNode) =>
  render(
    <BreadcrumbProvider>
      {ui}
      <Crumbs />
    </BreadcrumbProvider>,
  )

const read = () => screen.getByTestId("crumbs").textContent

describe("useSubPageBreadcrumb", () => {
  it("adds a single label", () => {
    draw(<Level items="Settings" />)

    expect(read()).toBe("Settings")
  })

  it("adds every level of an array", () => {
    draw(<Level items={[{ label: "Users", href: "/users" }, { label: "admin" }]} />)

    expect(read()).toBe("Users / admin")
  })

  it("keeps the levels behind one that repeats the crumb above", () => {
    // Was "Users": the repeat matched, and admin went with it.
    draw(
      <>
        <Level items={{ label: "Users", href: "/users" }} />
        <Level items={[{ label: "Users", href: "/users" }, { label: "admin" }]} />
      </>,
    )

    expect(read()).toBe("Users / admin")
  })

  it("adds nothing when every level is already there", () => {
    draw(
      <>
        <Level items={[{ label: "Users" }, { label: "admin" }]} />
        <Level items={[{ label: "Users" }, { label: "admin" }]} />
      </>,
    )

    expect(read()).toBe("Users / admin")
  })

  it("stages nothing until the value arrives", () => {
    const { rerender } = draw(<Level items={undefined} />)
    expect(read()).toBe("")

    rerender(
      <BreadcrumbProvider>
        <Level items="Settings" />
        <Crumbs />
      </BreadcrumbProvider>,
    )
    expect(read()).toBe("Settings")
  })

  /**
   * Mounts a parent level and, while `showChild`, a child one — so a rerender
   * unmounts the child alone. Swapping the tree's shape instead would remount
   * the parent too, and measure the harness rather than the hook.
   */
  function Nested({
    child,
    showChild,
  }: {
    readonly child: string | BreadcrumbItem | BreadcrumbItem[]
    readonly showChild: boolean
  }) {
    return (
      <BreadcrumbProvider>
        <Level items="Users" />
        {showChild ? <Level items={child} /> : null}
        <Crumbs />
      </BreadcrumbProvider>
    )
  }

  it("takes its levels away again on unmount", () => {
    const { rerender } = render(<Nested child="admin" showChild />)
    expect(read()).toBe("Users / admin")

    rerender(<Nested child="admin" showChild={false} />)

    expect(read()).toBe("Users")
  })

  it("removes only what it actually inserted", () => {
    // The child's first level was skipped as a repeat of the parent's, so
    // unmounting the child must not carry the parent's crumb out with it.
    const child = [{ label: "Users" }, { label: "admin" }]
    const { rerender } = render(<Nested child={child} showChild />)
    expect(read()).toBe("Users / admin")

    rerender(<Nested child={child} showChild={false} />)

    expect(read()).toBe("Users")
  })

  it("replaces its levels in place when the input changes", () => {
    const { rerender } = render(<Nested child="admin" showChild />)
    expect(read()).toBe("Users / admin")

    rerender(<Nested child="root" showChild />)

    expect(read()).toBe("Users / root")
  })

  it("does not double a repeated level when the input changes", () => {
    // Owning only the deduped tail, the update path used to splice two items
    // over the one it held and restate the parent's level.
    const { rerender } = render(
      <Nested child={[{ label: "Users" }, { label: "admin" }]} showChild />,
    )
    expect(read()).toBe("Users / admin")

    rerender(<Nested child={[{ label: "Users" }, { label: "root" }]} showChild />)

    expect(read()).toBe("Users / root")
  })

  it("does nothing at all without a provider above it", () => {
    // Module Federation remotes use this where the host may provide none.
    expect(() => render(<Level items="Settings" />)).not.toThrow()
  })
})
