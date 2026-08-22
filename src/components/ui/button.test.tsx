import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button, buttonVariants } from "./button"

describe("Button", () => {
  it("renders a button element carrying the data-slot hook consumers style against", () => {
    render(<Button>Save</Button>)

    const button = screen.getByRole("button", { name: "Save" })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("data-slot", "button")
  })

  it("calls onClick when pressed and stays silent when disabled", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    const { rerender } = render(<Button onClick={onClick}>Publish</Button>)
    await user.click(screen.getByRole("button", { name: "Publish" }))
    expect(onClick).toHaveBeenCalledTimes(1)

    rerender(
      <Button disabled onClick={onClick}>
        Publish
      </Button>,
    )
    await user.click(screen.getByRole("button", { name: "Publish" }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders the child element instead of a button when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>,
    )

    const link = screen.getByRole("link", { name: "Docs" })
    expect(link).toHaveAttribute("href", "/docs")
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("applies the variant and size classes the preset keys off", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>,
    )

    const button = screen.getByRole("button", { name: "Delete" })
    expect(button.className).toContain("bg-destructive")
    expect(button.className).toContain("h-10")
  })

  it("keeps a caller's className rather than dropping it for the variant class", () => {
    render(<Button className="w-full">Continue</Button>)

    expect(screen.getByRole("button", { name: "Continue" })).toHaveClass("w-full")
  })

  it("exposes buttonVariants so a non-button surface can borrow the same classes", () => {
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-accent")
  })
})
