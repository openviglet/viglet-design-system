import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconCpu2 } from "@tabler/icons-react";

import { BENTO_TONES } from "./bento-tones";
import { BentoTile } from "./bento-tile";

const meta = {
  title: "Bento/BentoTile",
  component: BentoTile,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "The frosted content tile. A tone drives the icon chip; the surface stays " +
          "neutral so colours never compete. Tones are CSS custom properties, so a " +
          "product re-keys the palette without forking anything.",
      },
    },
  },
  argTypes: {
    tone: { control: "select", options: BENTO_TONES },
  },
  args: {
    tone: "blue",
    eyebrow: "Generative AI",
    title: "Language models",
    // VDS119 — `children`, not `description`: the tile has no such prop, so
    // every specimen in this file rendered with no body at all and nothing said
    // so. The compiler never read this file until now.
    children: "Every model this install can reach.",
    icon: IconCpu2,
    span: "col-span-2",
    to: "/models",
  },
  decorators: [
    (Story) => (
      <div className="bento-grid grid w-full max-w-4xl auto-rows-[minmax(140px,auto)] grid-cols-2 gap-4 md:grid-cols-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BentoTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Featured: Story = {
  args: { featured: true, span: "col-span-2 row-span-2" },
};

export const WithoutDescription: Story = {
  args: { children: undefined },
};

/** Every tone, so the palette can be read at a glance rather than guessed. */
export const AllTones: Story = {
  render: (args) => (
    <>
      {BENTO_TONES.map((tone) => (
        <BentoTile key={tone} {...args} tone={tone} eyebrow={tone} title={tone} />
      ))}
    </>
  ),
};
