import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormActions } from "./form-actions";

const meta = {
  title: "UI/FormActions",
  component: FormActions,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Action bar for forms. Composes `FormActions.Cancel`, `FormActions.Submit`, and `FormActions.Delete` (mobile-only).",
      },
    },
  },
} satisfies Meta<typeof FormActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[32rem]">
      <FormActions>
        <FormActions.Cancel onClick={() => {}}>Cancel</FormActions.Cancel>
        <FormActions.Submit>Save changes</FormActions.Submit>
      </FormActions>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="w-[32rem]">
      <FormActions>
        <FormActions.Cancel onClick={() => {}}>Cancel</FormActions.Cancel>
        <FormActions.Submit loading>Saving...</FormActions.Submit>
      </FormActions>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-[32rem]">
      <FormActions>
        <FormActions.Cancel onClick={() => {}}>Cancel</FormActions.Cancel>
        <FormActions.Submit disabled>Save changes</FormActions.Submit>
      </FormActions>
    </div>
  ),
};

export const WithDelete: Story = {
  render: () => (
    <div className="w-[32rem]">
      <FormActions>
        <FormActions.Delete onClick={() => {}}>Delete</FormActions.Delete>
        <FormActions.Cancel onClick={() => {}}>Cancel</FormActions.Cancel>
        <FormActions.Submit>Save changes</FormActions.Submit>
      </FormActions>
    </div>
  ),
};
