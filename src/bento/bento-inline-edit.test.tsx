import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { BentoInlineEdit } from "./index"

// VDS156 — an edit saves once. The field stays mounted and live while the
// product's onSave runs, so a blur after the Enter that started the save used to
// commit again. Where focus lands afterwards is a browser's to decide, and is
// measured in bento-inline-edit.parity.test.tsx.

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({
      lng: "en",
      resources: { en: { translation: {} } },
      parseMissingKeyHandler: (key) => key,
    })
  }
})

function pendingSave() {
  let settle!: () => void
  const onSave = vi.fn(() => new Promise<void>((resolve) => (settle = resolve)))
  return { onSave, settle: () => act(async () => settle()) }
}

async function editTo(text: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole("button", { name: "Title" }))
  const field = screen.getByRole("textbox", { name: "Title" })
  await user.clear(field)
  await user.type(field, text)
  return { user, field }
}

describe("BentoInlineEdit", () => {
  it("saves once when the field blurs while the commit an Enter started is still running", async () => {
    const { onSave, settle } = pendingSave()
    render(
      <I18nextProvider i18n={i18next}>
        <BentoInlineEdit value="Draft" onSave={onSave} ariaLabel="Title" />
      </I18nextProvider>,
    )

    const { user, field } = await editTo("Published")
    await user.keyboard("{Enter}")
    fireEvent.blur(field)
    await user.keyboard("{Enter}")

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith("Published")
    await settle()
  })

  it("marks the field busy while its save runs, and saves again once it has settled", async () => {
    const { onSave, settle } = pendingSave()
    render(
      <I18nextProvider i18n={i18next}>
        <BentoInlineEdit value="Draft" onSave={onSave} ariaLabel="Title" />
      </I18nextProvider>,
    )

    const { user, field } = await editTo("Published")
    await user.keyboard("{Enter}")
    expect(field).toHaveAttribute("aria-busy", "true")
    await settle()

    // The product did not update `value`, so a second edit is a second save.
    await editTo("Archived")
    await user.keyboard("{Enter}")
    expect(onSave).toHaveBeenCalledTimes(2)
    await settle()
  })
})
