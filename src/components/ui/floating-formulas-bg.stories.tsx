import type { Meta, StoryObj } from "@storybook/react-vite";

import { FloatingFormulasBg } from "./floating-formulas-bg";

const meta = {
  title: "UI/FloatingFormulasBg",
  component: FloatingFormulasBg,
  tags: ["autodocs"],
  argTypes: {
    itemCount: { control: { type: "number", min: 0, max: 80, step: 1 } },
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
