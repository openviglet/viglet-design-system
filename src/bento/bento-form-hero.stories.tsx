import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2 } from "@tabler/icons-react";

import { BentoFormHero } from "./bento-form-hero";
import { BentoFormSection } from "./bento-form-section";
import { BentoBackLink, BentoHero } from "./bento-hero";
import { BentoSaveBar } from "./bento-save-bar";
import { BentoScrollSaveBar } from "./bento-scroll-save-bar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The hero, and the drop-in that gives an own-hero form the save-bar morph.
 *
 * The morph is the layer's most distinctive behaviour: the Save and Cancel
 * controls start in the hero and a fixed bar fades in exactly as the title
 * scrolls away, so the page never shows both. It is driven by a CSS custom
 * property written from a scroll loop, which is why it costs no React renders.
 */
// The morph reads a live value off <html>, so a still story renders its hero
// controls part-way through the fade — and an accessibility check then judges
// them on a blended colour they never actually have. Pinning it to 0 renders
// the hero exactly as it looks at the top of a real page.
const atRest = { "--bento-fade": 0 } as React.CSSProperties;

const meta = {
  title: "Bento/BentoFormHero",
  component: BentoFormHero,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BentoFormHero>;

export default meta;
/**
 * Not `StoryObj<typeof meta>`. Every story here composes a hero inside a page
 * rather than driving one through args, so the bound type would demand an
 * `args` nothing reads. What the compiler checks is the JSX in each `render`,
 * which it does either way (VDS119).
 */
type Story = StoryObj;

export const Hero: Story = {
  render: () => (
    <div className="p-6" style={atRest}>
      <BentoHero
        title="Language models"
        subtitle="Every model this install can reach"
        backTo="/models"
        backLabel="All models"
      />
    </div>
  ),
};

export const Default: Story = {
  render: () => (
    // The top padding is not decoration: the morph reads its progress from a
    // sentinel just below the hero, and in a short frame that sentinel starts
    // already inside the reveal range — so the hero controls would render
    // half-faded and be judged on a colour they never actually have.
    <form className="p-6" style={atRest}>
      <BentoFormHero title="Connection" onCancel={() => {}} dirty backTo="/models" backLabel="All models" />
      <BentoFormSection tone="violet" title="Endpoint" icon={IconCpu2}>
        <div className="grid gap-2">
          <Label htmlFor="url">URL</Label>
          <Input id="url" placeholder="https://" />
        </div>
      </BentoFormSection>
    </form>
  ),
};

/**
 * Long enough to scroll. Scroll this story and the hero's Save/Cancel fade out
 * as the fixed bar fades in — the two halves are one component, so they cannot
 * drift apart.
 */
export const ScrollForTheMorph: Story = {
  render: () => (
    <form className="p-6" style={atRest}>
      <BentoFormHero
        title="Global settings"
        stickyTitle="Settings"
        onCancel={() => {}}
        dirty
        backTo="/settings"
        backLabel="Back"
      />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 12 }, (_, i) => (
          <BentoFormSection key={i} tone="blue" title={`Section ${i + 1}`} icon={IconCpu2}>
            <div className="grid gap-2">
              <Label htmlFor={`field-${i}`}>Field {i + 1}</Label>
              <Input id={`field-${i}`} placeholder="Something to fill in" />
            </div>
          </BentoFormSection>
        ))}
      </div>
    </form>
  ),
};

/** The imperative escape hatch: your buttons, in both copies, morph intact. */
export const ImperativeActions: Story = {
  render: () => (
    <div className="p-6" style={atRest}>
      <BentoFormHero
        title="Custom facet"
        onCancel={() => {}}
        actions={
          <button type="button" className="rounded-md border px-3 py-1.5 text-sm">
            Apply
          </button>
        }
      />
    </div>
  ),
};

/** The bar on its own, in each of the states it reports. */
export const SaveBar: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6" style={atRest}>
      <BentoSaveBar title="Connection" onCancel={() => {}} dirty />
      <BentoSaveBar title="Connection" onCancel={() => {}} titleMissing />
      <BentoSaveBar title="Connection" onCancel={() => {}} loading />
    </div>
  ),
};

/** The scroll-linked twin, for a page that renders its own hero by hand. */
export const ScrollSaveBar: Story = {
  render: () => (
    <div className="p-6" style={atRest}>
      <BentoScrollSaveBar title="Connection" onCancel={() => {}} dirty />
    </div>
  ),
};

/** The eyebrow back-link, used on its own when a hero needs bespoke content. */
export const BackLink: Story = {
  render: () => (
    <div className="p-6">
      <BentoBackLink to="/models">All models</BentoBackLink>
    </div>
  ),
};
