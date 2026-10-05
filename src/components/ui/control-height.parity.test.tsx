import { IconCpu2, IconTrash } from "@tabler/icons-react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import i18next from "i18next"
import type { ReactElement } from "react"
import { I18nextProvider, initReactI18next } from "react-i18next"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import "@/styles/index.css"

import "@/bento/bento.css"

import { BentoActionsMenu } from "@/bento/bento-actions-menu"
import { BentoCalendar } from "@/bento/bento-calendar"
import { BentoDataTable } from "@/bento/bento-data-table"
import { BentoDiff } from "@/bento/bento-diff"
import { BentoEntityShell } from "@/bento/bento-entity-shell"
import { BentoEntityTile } from "@/bento/bento-entity-tile"
import { BentoListPage } from "@/bento/bento-list-page"

import { Button } from "./button"
import { GradientButton } from "./gradient-button"
import { Input } from "./input"
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "./navigation-menu"
import { Select, SelectTrigger, SelectValue } from "./select"
import { SidebarMenuButton, SidebarMenuSubButton, SidebarProvider } from "./sidebar"
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
  // VDS200. SidebarMenuButton `lg` is a 48 px row carrying a two-line label, and
  // the command palette's field is its dialog's header row: neither is a control.
  "SidebarMenuButton default": <SidebarProvider><SidebarMenuButton>Home</SidebarMenuButton></SidebarProvider>,
  "SidebarMenuButton sm": <SidebarProvider><SidebarMenuButton size="sm">Home</SidebarMenuButton></SidebarProvider>,
  "SidebarMenuSubButton md": <SidebarProvider><SidebarMenuSubButton href="#">Home</SidebarMenuSubButton></SidebarProvider>,
  "SidebarMenuSubButton sm": (
    <SidebarProvider><SidebarMenuSubButton size="sm" href="#">Home</SidebarMenuSubButton></SidebarProvider>
  ),
  NavigationMenuTrigger: (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem><NavigationMenuTrigger>Docs</NavigationMenuTrigger></NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
}

function heightOf(control: ReactElement) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const { unmount } = render(control, { container: host })
  const element = host.querySelector("button, input, a")!
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

  it("draws the bento list's reorder grip at the dense height", async () => {
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
    }
    const { unmount } = render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoListPage<{ id: string }>
            items={[{ id: "a" }]}
            listId="llm"
            layout={{
              data: { listId: "llm", source: "DEFAULT", canEditGlobal: false, entries: [] },
              onSave: () => {},
            }}
            tryAgainUrl="/llm"
            heroIcon={IconCpu2}
            title="Models"
            subtitle="Every model"
            newRoute="/llm/new"
            newLabel="New model"
            itemKey={(i) => i.id}
            renderTile={(item, emphasis) => (
              <BentoEntityTile to={`/llm/${item.id}`} emphasis={emphasis} defaultIcon={IconCpu2} title={item.id} />
            )}
            emptyTitle="No models yet"
            emptyDescription="Add one"
          />
        </MemoryRouter>
      </I18nextProvider>,
    )
    await userEvent.click(screen.getByRole("button", { name: /customize/i }))
    const grip = screen.getAllByRole("button", { name: /reorder/i })[0]
    expect(grip.getBoundingClientRect().height).toBe(SCALE[0])
    unmount()
  })

  // VDS201. Shio's census still read 16 to 37 px buttons from these. The controls
  // among them are on the scale; the rest are text a reader clicks (an inline
  // edit's value, a sort header, a fold, a calendar entry) and say so.
  it("draws every bento button that is not text on the scale", async () => {
    if (!i18next.isInitialized) {
      await i18next.use(initReactI18next).init({ lng: "en", resources: { en: { translation: {} } } })
    }
    const { container, unmount } = render(
      <I18nextProvider i18n={i18next}>
        <MemoryRouter>
          <BentoCalendar
            entries={[{ id: "launch", start: "2026-09-10T17:00:00Z", label: "Launch" }]}
            defaultDate="2026-09-15T12:00:00Z"
          />
          <BentoDataTable<{ id: string }>
            rows={[{ id: "a" }]}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.id}
            columns={[{ id: "id", header: "Name", cell: (row) => row.id, sortValue: (row) => row.id }]}
            label="Rows"
            rowHeight={40}
            height={200}
          />
          <BentoDiff before={{ a: "1", b: "x" }} after={{ a: "1", b: "y" }} fields={[{ id: "a", label: "A" }, { id: "b", label: "B" }]} />
          <BentoEntityShell<{ id: string; title: string; description: string; icon: string | null; enabled: number }>
            entity={{ id: "1", title: "Editors", description: "Who edits", icon: null, enabled: 1 }}
            isNew={false}
            headlineFallback="Untitled"
            eyebrow="All groups"
            listRoute="/groups"
            icon={IconCpu2}
            tone="blue"
            formId="group-form"
            feature="group"
            hasStatus
            hideIcon
          >
            {() => <div />}
          </BentoEntityShell>
        </MemoryRouter>
      </I18nextProvider>,
    )
    const buttons = [...container.querySelectorAll("button")]
    const controls = buttons.filter((button) => !button.matches('[data-look="text"]'))
    expect(buttons.length - controls.length).toBeGreaterThanOrEqual(5)
    expect(controls.length).toBeGreaterThanOrEqual(6)
    for (const button of controls) expect(SCALE).toContain(button.getBoundingClientRect().height)
    unmount()
  })

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
