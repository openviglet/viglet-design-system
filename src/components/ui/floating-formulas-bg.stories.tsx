import type { Meta, StoryObj } from "@storybook/react-vite";

import { FloatingFormulasBg } from "./floating-formulas-bg";

const meta = {
  title: "UI/FloatingFormulasBg",
  component: FloatingFormulasBg,
  tags: ["autodocs"],
  parameters: {
    a11y: {
      config: {
        rules: [
          // This component is decorative background art: low-opacity chemistry
          // terms drifting behind a page, already aria-hidden so no screen
          // reader meets them. Contrast is deliberately below threshold — text
          // that met it would be the foreground. Every other rule still holds.
          { id: "color-contrast", enabled: false },
        ],
      },
    },
  },
  argTypes: {
    itemCount: { control: { type: "number", min: 0, max: 80, step: 1 } },
    seed: { control: { type: "number" } },
    color: { control: "color" },
    colorDark: { control: "color" },
    withFormulas: { control: "boolean" },
    withBonds: { control: "boolean" },
    withOrbs: { control: "boolean" },
    withLightning: { control: "boolean" },
    withExplosion: { control: "boolean" },
    withGrid: { control: "boolean" },
  },
} satisfies Meta<typeof FloatingFormulasBg>;

export default meta;
type Story = StoryObj<typeof meta>;

const Container = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-[500px] w-[700px] overflow-hidden rounded-lg border bg-background">
    {children}
  </div>
);

export const Default: Story = {
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const OnlyOrbs: Story = {
  args: {
    withFormulas: false,
    withBonds: false,
    withGrid: false,
    withOrbs: true,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const OnlyFormulas: Story = {
  args: {
    withFormulas: true,
    withBonds: false,
    withOrbs: false,
    withGrid: false,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const WithLightning: Story = {
  args: {
    withLightning: true,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const WithExplosion: Story = {
  args: {
    withLightning: true,
    withExplosion: true,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const GreenPalette: Story = {
  args: {
    color: "#10b981",
    colorDark: "#34d399",
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const Minimal: Story = {
  args: {
    itemCount: 10,
    withBonds: false,
    withOrbs: false,
    withLightning: false,
    withGrid: true,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

export const FullEffects: Story = {
  args: {
    itemCount: 40,
    withFormulas: true,
    withBonds: true,
    withOrbs: true,
    withGrid: true,
    withLightning: true,
    withExplosion: true,
  },
  render: (args) => (
    <Container>
      <FloatingFormulasBg {...args} />
    </Container>
  ),
};

/**
 * The arrangement is a function of the props. Two backgrounds given the same
 * `seed` are identical; change the seed and the terms are placed afresh. Omit it
 * and the seed comes from the formula pool, so a page looks the same on every
 * visit — pass `seed={Date.now()}` where a product wants it to vary.
 */
export const SeededLayout: Story = {
  args: {
    itemCount: 14,
    withBonds: false,
    withOrbs: false,
    withGrid: false,
  },
  render: (args) => (
    <div className="flex gap-3">
      {[1, 1, 2].map((seed, index) => (
        <div
          key={`${seed}-${index}`}
          className="relative h-[240px] w-[220px] overflow-hidden rounded-lg border bg-background"
        >
          <FloatingFormulasBg {...args} seed={seed} />
          <span className="absolute bottom-2 left-2 rounded bg-background/80 px-1.5 py-0.5 text-xs text-muted-foreground">
            seed={seed}
          </span>
        </div>
      ))}
    </div>
  ),
};
