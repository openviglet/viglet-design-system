import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./accordion";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["single", "multiple"],
    },
    collapsible: { control: "boolean" },
  },
  args: {
    type: "single",
    collapsible: true,
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Accordion {...args} className="w-[420px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>
          Yes. It adheres to the WAI-ARIA design pattern.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is it styled?</AccordionTrigger>
        <AccordionContent>
          Yes. It comes with default styles that match the rest of the design system.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Is it animated?</AccordionTrigger>
        <AccordionContent>
          Yes. It is animated by default, but you can disable it if you prefer.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  args: {
    type: "multiple",
  },
  render: (args) => (
    <Accordion {...args} className="w-[420px]">
      <AccordionItem value="features">
        <AccordionTrigger>Features</AccordionTrigger>
        <AccordionContent>
          Supports keyboard navigation, ARIA attributes, and smooth transitions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="installation">
        <AccordionTrigger>Installation</AccordionTrigger>
        <AccordionContent>
          Add the component to your project and import the pieces you need.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="usage">
        <AccordionTrigger>Usage</AccordionTrigger>
        <AccordionContent>
          Compose Accordion, AccordionItem, AccordionTrigger and AccordionContent.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const DefaultOpen: Story = {
  args: {
    defaultValue: "item-1",
  },
  render: (args) => (
    <Accordion {...args} className="w-[420px]">
      <AccordionItem value="item-1">
        <AccordionTrigger>Open by default</AccordionTrigger>
        <AccordionContent>
          This item is expanded the first time the accordion is rendered.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Closed by default</AccordionTrigger>
        <AccordionContent>This item starts collapsed.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
