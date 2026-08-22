import { IconBolt, IconFolder, IconSparkles } from "@tabler/icons-react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { useLayoutEffect } from "react"

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

/** The four values a product declares. Nothing else is set — the rest derives. */
const WARM = {
  "--vg-accent-from": "oklch(70.5% 0.213 47.604)",
  "--vg-accent-to": "oklch(64.6% 0.222 41.116)",
  "--vg-accent-text": "oklch(50.5% 0.185 38.402)",
  "--vg-accent-text-dark": "oklch(75% 0.183 55.934)",
}

/**
 * Applies a token set the way a product does — on the document element — and
 * puts it back on the way out so the neighbouring story is unaffected.
 *
 * The root is not a stylistic preference here. The derived tokens are
 * `color-mix` over `--vg-accent-from` **declared on `:root`**, and a custom
 * property substitutes its `var()` references where it is declared, not where
 * it is read. Set the four on a wrapper `<div>` and the chip and the solid fill
 * re-key — they mix inline, in a utility class, on the element — while the
 * tint, the hairline and the button fill quietly keep the root's blue. An
 * earlier draft of this very story did that, and showed two specimens that
 * never moved.
 */
function useAccent(tokens: Record<string, string> | null) {
  useLayoutEffect(() => {
    if (!tokens) return
    const root = document.documentElement
    const previous = Object.keys(tokens).map((name) => [name, root.style.getPropertyValue(name)] as const)
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value)
    return () => {
      for (const [name, value] of previous) {
        if (value) root.style.setProperty(name, value)
        else root.style.removeProperty(name)
      }
    }
  }, [tokens])
}

function Panel({ tokens, label }: Readonly<{ tokens: Record<string, string> | null; label: string }>) {
  useAccent(tokens)
  return (
    <div className="max-w-md">
      <AccentSpecimen label={label} />
    </div>
  )
}

/** The blue the console shipped with — what a product gets without re-keying. */
export const Default: Story = {
  render: () => <Panel tokens={null} label="default — blue" />,
}

/**
 * The same markup, four declarations apart. Compare it with `Default`: every
 * specimen moves, because nothing in the markup reaches for a hue.
 *
 * Deliberately not side by side. Two panels in one view would need the tokens
 * on a wrapper, which is the form that does not work — and a catalogue that
 * demonstrates a broken mechanism is worse than one that shows the real one.
 */
export const Rekeyed: Story = {
  name: "Re-keyed at the root",
  render: () => <Panel tokens={WARM} label="re-keyed — orange" />,
}
