import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import {
  BentoEntityShell,
  BentoHeroIconPicker,
  BentoInlineEdit,
  type BentoEntityShellRenderArgs,
} from "./index"

// The shell is the gold standard a detail page copies, and the promise is that
// a page costs one call and carries no shell mechanics of its own. So what is
// asserted is the contract at that seam: what the render prop receives, what
// the hero owns rather than the form, and that identity edits reach the child
// without the page wiring anything.

interface Entity {
  id: string
  title: string
  description: string
  icon: string | null
  enabled: number
}

const entity: Entity = {
  id: "1",
  title: "GPT",
  description: "A model",
  icon: null,
  enabled: 1,
}

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function draw(ui: ReactElement) {
  return render(
    <I18nextProvider i18n={i18next}>
      <MemoryRouter>{ui}</MemoryRouter>
    </I18nextProvider>,
  )
}

function shell(
  children: (args: BentoEntityShellRenderArgs) => ReactElement,
  overrides: Partial<React.ComponentProps<typeof BentoEntityShell<Entity>>> = {},
) {
  return draw(
    <BentoEntityShell<Entity>
      entity={entity}
      isNew={false}
      headlineFallback="Untitled"
      eyebrow="All models"
      listRoute="/llm"
      icon={IconCpu2}
      tone="blue"
      formId="llm-form"
      feature="model"
      {...overrides}
    >
      {children}
    </BentoEntityShell>,
  )
}

describe("BentoEntityShell", () => {
  it("renders the entity's identity in the hero, not in the form", () => {
    shell(() => <div data-testid="form" />)

    expect(screen.getByText("GPT")).toBeInTheDocument()
    expect(screen.getByText("A model")).toBeInTheDocument()
    expect(screen.getByTestId("form")).toBeInTheDocument()
  })

  it("hands the render prop the staged identity and a state callback", () => {
    const child = vi.fn((_args: BentoEntityShellRenderArgs) => <div />)
    shell(child)

    const args = child.mock.calls[0][0]
    expect(args.staged).toMatchObject({ title: "GPT", description: "A model", enabled: 1 })
    expect(typeof args.onStateChange).toBe("function")
  })

  it("restages the title as it is edited, so the child sees it without a save", async () => {
    const user = userEvent.setup()
    const seen: string[] = []
    shell((args) => {
      seen.push(args.staged.title)
      return <div />
    })

    // The title is click-to-edit: display text until it is asked for.
    await user.click(screen.getByText("GPT"))
    const title = screen.getByRole("textbox", { name: /title/i })
    await user.clear(title)
    await user.type(title, "Claude")
    await user.tab()

    expect(seen.at(-1)).toBe("Claude")
  })

  it("shows the status pill only when the entity has status", () => {
    const { container, unmount } = shell(() => <div />)
    expect(container.querySelector(".bento-status-on")).not.toBeInTheDocument()
    unmount()

    const withStatus = shell(() => <div />, { hasStatus: true })
    expect(withStatus.container.querySelector(".bento-status-on")).toBeInTheDocument()
  })

  it("leads back to the list it was given", () => {
    shell(() => <div />)

    expect(screen.getByRole("link", { name: /All models/ })).toHaveAttribute("href", "/llm")
  })

  it("keeps the chip but drops its picker affordance when hideIcon is set", () => {
    const { container, unmount } = shell(() => <div />)
    expect(container.querySelector(".bento-chip")).toBeInTheDocument()
    const editable = container.querySelectorAll("button").length
    unmount()

    const hidden = shell(() => <div />, { hideIcon: true })
    expect(hidden.container.querySelector(".bento-chip")).toBeInTheDocument()
    expect(hidden.container.querySelectorAll("button").length).toBeLessThan(editable)
  })
})

describe("BentoInlineEdit", () => {
  it("saves an edit on blur", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    draw(<BentoInlineEdit value="Old" onSave={onSave} ariaLabel="Title" />)

    await user.click(screen.getByText("Old"))
    const field = screen.getByLabelText("Title")
    await user.clear(field)
    await user.type(field, "New")
    await user.tab()

    expect(onSave).toHaveBeenCalledWith("New")
  })

  it("does not save an unchanged value", async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    draw(<BentoInlineEdit value="Same" onSave={onSave} ariaLabel="Title" />)
    await user.click(screen.getByText("Same"))
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
  })
})

describe("BentoHeroIconPicker", () => {
  it("renders a static chip with no picker when read-only", () => {
    const { container } = draw(
      <BentoHeroIconPicker
        value={null}
        onChange={vi.fn()}
        defaultIcon={IconCpu2}
        tone="violet"
        readOnly
      />,
    )

    expect(container.querySelector(".bento-tone-violet")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("offers a clear affordance only when an icon is set", () => {
    const { container, unmount } = draw(
      <BentoHeroIconPicker value={null} onChange={vi.fn()} onClear={vi.fn()} defaultIcon={IconCpu2} tone="blue" />,
    )
    expect(container.querySelector(".bento-clear")).not.toBeInTheDocument()
    unmount()

    const set = draw(
      <BentoHeroIconPicker value="tabler:robot" onChange={vi.fn()} onClear={vi.fn()} defaultIcon={IconCpu2} tone="blue" />,
    )
    expect(set.container.querySelector(".bento-clear")).toBeInTheDocument()
  })
})
