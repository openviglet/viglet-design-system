import { act, render } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { afterEach, beforeAll, describe, expect, it } from "vitest"
import { userEvent } from "vitest/browser"

import "@/styles/index.css"
import "./bento.css"

import { BentoInlineEdit } from "./index"

/**
 * VDS156 — an inline edit keeps its place, measured where focus is real.
 *
 * Committing with Enter, or leaving with Escape, unmounts the field that holds
 * focus, and a browser then drops focus to the body as the value lands. The
 * display button that replaces the field takes it back. A commit on blur is the
 * opposite case: the reader has already gone somewhere, and focus stays there.
 *
 * VDS162 — where focus has to *arrive*, it is polled rather than read once. The
 * component restores it in an effect, which `act` runs, so reading straight
 * afterwards holds on a quiet machine; it is still a synchronous read of what
 * the browser applies on its own schedule, and this project runs a headless
 * page beside 160 other files. `activeElement` back on the body then reports
 * that an inline edit lost its focus — a defect report about the component,
 * from a test that measured the run.
 */

beforeAll(async () => {
  if (!i18next.isInitialized) {
    await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
  }
})

afterEach(() => {
  document.body.replaceChildren()
})

function draw() {
  let settle: (() => void) | undefined
  const onSave = () => new Promise<void>((resolve) => (settle = resolve))
  const { container } = render(
    <I18nextProvider i18n={i18next}>
      <BentoInlineEdit value="Draft" onSave={onSave} ariaLabel="Title" />
      <button type="button">Next control</button>
    </I18nextProvider>,
  )
  const display = () => container.querySelector<HTMLButtonElement>("button[aria-label='Title']")
  const field = () => container.querySelector<HTMLInputElement>("input[aria-label='Title']")!
  const next = container.querySelector<HTMLButtonElement>("button:not([aria-label])")!
  return { display, field, next, settle: () => act(async () => settle?.()) }
}

async function openAndType({ display, field }: ReturnType<typeof draw>, text: string) {
  await userEvent.click(display()!)
  await userEvent.fill(field(), text)
}

describe("focus after an inline edit", () => {
  it("returns to the display button once a commit from Enter has saved", async () => {
    const edit = draw()
    await openAndType(edit, "Published")

    await userEvent.keyboard("{Enter}")
    await edit.settle()

    expect(edit.display()).not.toBeNull()
    await expect.poll(() => document.activeElement).toBe(edit.display())
  })

  it("returns to the display button when Escape leaves the field", async () => {
    const edit = draw()
    await openAndType(edit, "Abandoned")

    await userEvent.keyboard("{Escape}")

    await expect.poll(() => document.activeElement).toBe(edit.display())
  })

  it("stays where the reader tabbed to when the commit came from leaving the field", async () => {
    const edit = draw()
    await openAndType(edit, "Published")

    // The opposite claim, so the opposite reading: focus has to *not* move, and
    // an assertion that nothing happened cannot be waited for — polling it would
    // pass the moment it was true and never see it move afterwards. The flush is
    // what this one has, and it is the right instrument for it.
    await userEvent.tab()
    expect(document.activeElement).toBe(edit.next)
    await edit.settle()

    expect(document.activeElement).toBe(edit.next)
  })
})
