import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { IconCpu2 } from "@tabler/icons-react"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { toast } from "sonner"

import { expectConsoleErrors } from "@/test/console-error-gate"

// The shell announces every autosave through sonner, and VDS58 is partly about
// which name it announces. Mocked so that is assertable at all.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

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

// VDS58 — the failure paths, which nothing exercised. persistField stages the
// patch and then awaits onUpdate; when that rejected, nothing put staged back,
// and the props resync could not, because a save that failed leaves the entity
// prop untouched and that comparison is what drives it.
describe("BentoEntityShell when a save fails", () => {
  async function renameTo(next: string) {
    const user = userEvent.setup()
    await user.click(screen.getByText("GPT"))
    const title = screen.getByRole("textbox", { name: /title/i })
    await user.clear(title)
    await user.type(title, next)
    await user.tab()
  }

  it("puts the field back when onUpdate rejects", async () => {
    expectConsoleErrors("Failed to update entity field")
    const onUpdate = vi.fn().mockRejectedValue(new Error("nope"))
    const seen: string[] = []
    shell((args) => {
      seen.push(args.staged.title)
      return <div />
    }, { onUpdate })

    await renameTo("Claude")

    expect(onUpdate).toHaveBeenCalled()
    // The entity's own title, not the one that was typed and refused.
    expect(seen.at(-1)).toBe("GPT")
    expect(screen.getByText("GPT")).toBeInTheDocument()
  })

  it("names the entity in the toast by the value just saved", async () => {
    // This harness renders missing keys literally, which drops interpolation
    // with them — the one string being asserted gets a real translation.
    i18next.addResource("en", "translation", "forms.common.updated", "{{name}} updated")
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    shell(() => <div />, { onUpdate })

    await renameTo("Claude")

    // Not "GPT updated": staged.title is the value from the render that began
    // the save, over a field already showing the new one.
    expect(toast.success).toHaveBeenCalledWith("Claude updated")
  })

  it("keeps the edit when onUpdate resolves", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    const seen: string[] = []
    shell((args) => {
      seen.push(args.staged.title)
      return <div />
    }, { onUpdate })

    await renameTo("Claude")

    expect(seen.at(-1)).toBe("Claude")
  })

  it("survives onDelete rejecting", async () => {
    expectConsoleErrors("Failed to delete entity")
    // Radix guards its trigger with pointer-events, which jsdom does not model.
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const onDelete = vi.fn().mockRejectedValue(new Error("nope"))
    shell(() => <div />, { onDelete })

    // By its own label: this harness renders missing keys literally, so Save
    // and Cancel are "forms.formActions.save"/".cancel" and both match /actions/.
    await user.click(screen.getByRole("button", { name: /moreActions/i }))
    await user.click(await screen.findByRole("menuitem", { name: /\.delete$/i }))

    // The dialog is type-to-confirm: the entity's name has to be typed before
    // the destructive button enables.
    const dialog = await screen.findByRole("dialog")
    await user.type(within(dialog).getByRole("textbox"), "GPT")
    await user.click(within(dialog).getByRole("button", { name: /deleteFeature/i }))

    expect(onDelete).toHaveBeenCalled()
    // Still on the page, with the entity intact.
    expect(screen.getByText("GPT")).toBeInTheDocument()
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

// Ported from the suite that guarded this component inside the product. These
// are the modes a detail page actually runs in — new, autosave-only, read-only —
// and each was learned from a screen that got one of them wrong.
describe("BentoEntityShell modes", () => {
  const dirtyChild = (args: BentoEntityShellRenderArgs) => (
    <button type="button" onClick={() => args.onStateChange({ isDirty: true, isSubmitting: false })}>
      make-dirty
    </button>
  )

  it("stages an empty identity in new mode and still offers Save", () => {
    shell(({ staged }) => <div data-testid="child">{staged.title || "EMPTY"}</div>, {
      entity: {} as Entity,
      isNew: true,
    })

    expect(screen.getByTestId("child")).toHaveTextContent("EMPTY")
    expect(screen.getAllByRole("button", { name: /save/i }).length).toBeGreaterThan(0)
  })

  it("offers Save on an existing entity but disables it until the form is dirty", async () => {
    const user = userEvent.setup()
    shell(dirtyChild, { hasStatus: true })

    const before = screen.getAllByRole("button", { name: /save/i })
    expect(before.length).toBeGreaterThan(0)
    for (const button of before) expect(button).toBeDisabled()

    await user.click(screen.getByText("make-dirty"))

    for (const button of screen.getAllByRole("button", { name: /save/i })) {
      expect(button).toBeEnabled()
    }
  })

  it("hides the inert Save on an autosave-only entity, and keeps Cancel", async () => {
    const user = userEvent.setup()
    shell(dirtyChild, { autosaveOnly: true })

    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: /cancel/i }).length).toBeGreaterThan(0)

    // Reporting dirty must not resurrect it — there is nothing to submit.
    await user.click(screen.getByText("make-dirty"))
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
  })

  it("keeps Save in new mode even when autosave-only, because it is what creates the entity", () => {
    shell(() => <div />, { entity: {} as Entity, isNew: true, autosaveOnly: true })

    expect(screen.getAllByRole("button", { name: /save/i }).length).toBeGreaterThan(0)
  })

  it("never reveals Save in read-only mode, and renders the badge and notice", async () => {
    const user = userEvent.setup()
    shell(dirtyChild, {
      readOnly: true,
      badge: <span>GLOBAL-BADGE</span>,
      notice: <div>READ-ONLY-NOTICE</div>,
    })

    expect(screen.getByText("GLOBAL-BADGE")).toBeInTheDocument()
    expect(screen.getByText("READ-ONLY-NOTICE")).toBeInTheDocument()

    await user.click(screen.getByText("make-dirty"))
    expect(screen.queryByRole("button", { name: /save/i })).not.toBeInTheDocument()
  })
})
