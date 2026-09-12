import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import { type ReactElement, useState } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoDiff, BentoVersionRail, type BentoDiffField, type BentoVersion } from "./index"

// VDS140 — one comparison for revision history, review and translation, and the
// rail two versions are picked from. Asserted on what a reader gets, including one
// who cannot see the colours.

const FIELDS: BentoDiffField[] = [
  { id: "title", label: "Title" },
  { id: "body", label: "Body", kind: "rich" },
  { id: "order", label: "Order", kind: "value" },
  { id: "slug", label: "Slug" },
]

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

function draw(ui: ReactElement) {
  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>)
}

/** A field's row, found by its label. */
const field = (label: string) => screen.getByText(label, { selector: "dt > span:first-child" }).closest("div")!

describe("BentoDiff", () => {
  it("renders a created page's content as additions, not an empty panel", () => {
    draw(
      <BentoDiff
        before={null}
        after={{ title: "Quarterly results", body: "<h2>Summary</h2><p>Margin rose.</p>", order: 3, slug: "q3" }}
        fields={FIELDS}
      />,
    )

    expect(screen.getByText("Created in this version")).toBeInTheDocument()
    const body = field("Body")
    expect(within(body).getByText("Added")).toBeInTheDocument()
    expect(body.querySelectorAll("ins")).toHaveLength(2)
    expect(body).toHaveTextContent("Summary")
    expect(body).toHaveTextContent("Margin rose.")
    expect(screen.queryByText("No field changed")).not.toBeInTheDocument()
  })

  it("names a change in words as well as colour", () => {
    draw(
      <BentoDiff
        before={{ title: "Quarterly results", slug: "q3" }}
        after={{ title: "Third quarter results", slug: "q3" }}
        fields={FIELDS}
      />,
    )

    const title = field("Title")
    expect(within(title).getByText("Changed")).toBeInTheDocument()
    // The words that moved, each carrying what happened to it as text.
    const removed = [...title.querySelectorAll("del")]
    const added = [...title.querySelectorAll("ins")]
    expect(removed.map((el) => el.textContent)).toEqual(["removed: Quarterly"])
    expect(added.length).toBeGreaterThan(0)
    for (const el of added) expect(el.textContent).toMatch(/^added: /)
    expect(added.map((el) => el.textContent!.replace("added: ", "")).join("")).toMatch(/Third\s*quarter/)
    // What stayed is not marked.
    expect([...removed, ...added].some((el) => el.textContent!.includes("results"))).toBe(false)
  })

  it("treats a change of markup alone as no change, and diffs rich text by block", () => {
    const { unmount } = draw(
      <BentoDiff before={{ body: "<p>Hello <b>world</b></p>" }} after={{ body: "<p>Hello world</p>" }} fields={FIELDS} />,
    )
    expect(screen.getByText("No field changed")).toBeInTheDocument()
    unmount()

    draw(
      <BentoDiff
        before={{ body: "<p>One.</p><p>Two.</p>" }}
        after={{ body: "<p>One.</p><p>Inserted.</p><p>Two.</p>" }}
        fields={FIELDS}
      />,
    )
    const body = field("Body")
    // The paragraph added between two others is one added block; the others stand.
    expect(body.querySelectorAll("ins")).toHaveLength(1)
    expect(body.querySelector("ins")).toHaveTextContent("Inserted.")
    expect(body.querySelectorAll("del")).toHaveLength(0)
  })

  it("collapses unchanged fields behind a count a reader can open", async () => {
    const user = userEvent.setup()
    draw(<BentoDiff before={{ title: "A", slug: "a", order: 1 }} after={{ title: "B", slug: "a", order: 1 }} fields={FIELDS} />)

    const toggle = screen.getByRole("button", { name: "3 unchanged" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Slug", { selector: "dt > span:first-child" })).not.toBeInTheDocument()

    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-expanded", "true")
    expect(field("Slug")).toHaveTextContent("Unchanged")
  })

  it("shows a value field's two sides, and a deleted item as removals", () => {
    const { unmount } = draw(<BentoDiff before={{ order: 1 }} after={{ order: 2 }} fields={FIELDS} />)
    const order = field("Order")
    expect(order.querySelector("del")).toHaveTextContent("1")
    expect(order.querySelector("ins")).toHaveTextContent("2")
    unmount()

    draw(<BentoDiff before={{ title: "Gone" }} after={null} fields={FIELDS} />)
    expect(screen.getByText("Deleted in this version")).toBeInTheDocument()
    expect(field("Title").querySelector("del")).toHaveTextContent("Gone")
  })
})

describe("BentoVersionRail", () => {
  const VERSIONS: BentoVersion[] = [
    { id: "v3", author: "Drafting agent", actor: "agent", at: "2026-09-12T10:00:00Z", summary: "Rewrote the summary" },
    { id: "v2", author: "Ana Silva", actor: "human", at: "2026-09-11T10:00:00Z" },
    { id: "v1", author: "Ana Silva", actor: "human", at: "2026-09-10T10:00:00Z" },
  ]

  function Rail({ spy }: Readonly<{ spy: (ids: string[]) => void }>) {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <BentoVersionRail
        versions={VERSIONS}
        selected={selected}
        onSelect={(ids) => {
          spy(ids)
          setSelected(ids)
        }}
      />
    )
  }

  it("says who made each version and whether a person or an agent did", () => {
    draw(<Rail spy={() => {}} />)
    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveTextContent("Drafting agent")
    expect(options[0]).toHaveTextContent("Agent")
    expect(options[1]).toHaveTextContent("Person")
    expect(options[0].querySelector("time")).toHaveAttribute("dateTime", "2026-09-12T10:00:00.000Z")
  })

  it("picks two versions from the keyboard, older first, and lets go of the oldest pick on a third", async () => {
    const user = userEvent.setup()
    const spy = vi.fn()
    draw(<Rail spy={spy} />)

    const listbox = screen.getByRole("listbox", { name: "Versions" })
    expect(listbox).toHaveAttribute("aria-multiselectable", "true")

    screen.getAllByRole("option")[0].focus()
    await user.keyboard(" ")
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}")
    expect(spy).toHaveBeenLastCalledWith(["v1", "v3"])
    expect(screen.getAllByRole("option").map((o) => o.getAttribute("aria-selected"))).toEqual(["true", "false", "true"])

    await user.keyboard("{ArrowUp} ")
    // v3 was picked first, so it is the one let go.
    expect(spy).toHaveBeenLastCalledWith(["v1", "v2"])
    expect(screen.getAllByRole("option")[1]).toHaveFocus()
  })
})
