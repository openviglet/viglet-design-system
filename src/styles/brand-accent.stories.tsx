import { IconBolt, IconFolder, IconSparkles } from "@tabler/icons-react"
import type { Meta, StoryObj } from "@storybook/react-vite"

/**
 * The brand accent, and what re-keying it actually changes.
 *
 * Everything below is the *same markup*; the only difference between the two
 * panels is four custom properties set on a wrapper. That is the whole point of
 * the token: a product picks its colour once, at the root, and no shared
 * component knows which product it is rendering inside.
 */
const meta = {
  title: "Tokens/Brand accent",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A page header's tinted chip, an accented label and a solid fill all derive from `--vg-accent-from` and `--vg-accent-to`. Set them at the root to re-key a product.",
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** The four shapes the accent takes, so a re-key can be judged at a glance. */
function AccentSpecimen({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg vg-accent-chip ring-1">
          <IconFolder className="size-5 vg-accent-text" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Collections</p>
          <p className="text-xs text-muted-foreground">the tinted chip, as a page header wears it</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vg-accent-surface)] px-3 py-1 text-xs font-medium text-[var(--vg-accent-fg)]">
          <IconSparkles className="size-3.5" />
          the tint
        </span>
        <span className="rounded-full border border-[var(--vg-accent-line)] px-3 py-1 text-xs">the hairline</span>
        <span className="rounded-full bg-[var(--vg-accent-surface-strong)] px-3 py-1 text-xs text-[var(--vg-accent-fg)]">
          the strong tint
        </span>
      </div>

      <button
        type="button"
        className="inline-flex w-fit items-center gap-1.5 rounded-lg vg-accent-solid px-3 py-1.5 text-sm font-medium text-white"
      >
        <IconBolt className="size-4" />
        the solid fill
      </button>
    </div>
  )
}

/** The blue the console shipped with — what a product gets without re-keying. */
export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <AccentSpecimen label="default" />
    </div>
  ),
}

/**
 * Same markup, four declarations apart. This is the proof the criterion asks
 * for: nothing below reaches for a hue, so the two panels differ only where a
 * product should.
 */
export const Rekeyed: Story = {
  name: "Re-keyed per product",
  render: () => (
    <div className="grid max-w-3xl gap-5 sm:grid-cols-2">
      <AccentSpecimen label="default — blue" />
      <div
        style={
          {
            "--vg-accent-from": "oklch(70.5% 0.213 47.604)",
            "--vg-accent-to": "oklch(64.6% 0.222 41.116)",
            "--vg-accent-text": "oklch(50.5% 0.185 38.402)",
            "--vg-accent-fg": "oklch(50.5% 0.185 38.402)",
          } as React.CSSProperties
        }
      >
        <AccentSpecimen label="re-keyed — orange" />
      </div>
    </div>
  ),
}
