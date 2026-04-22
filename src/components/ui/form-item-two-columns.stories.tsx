import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";

import { Form, FormControl, FormField } from "./form";
import { FormItemTwoColumns } from "./form-item-two-columns";
import { Switch } from "./switch";

type DemoValues = {
  notifications: boolean;
};

function FormItemTwoColumnsDemo() {
  const form = useForm<DemoValues>({
    defaultValues: { notifications: true },
  });

  return (
    <Form {...form}>
      <form className="w-[32rem]">
        <FormField
          control={form.control}
          name="notifications"
          render={({ field }) => (
            <FormItemTwoColumns>
              <FormItemTwoColumns.Left>
                <FormItemTwoColumns.Label>
                  Email notifications
                </FormItemTwoColumns.Label>
                <FormItemTwoColumns.Description>
                  Receive an email whenever something important happens.
                </FormItemTwoColumns.Description>
              </FormItemTwoColumns.Left>
              <FormItemTwoColumns.Right>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItemTwoColumns.Right>
            </FormItemTwoColumns>
          )}
        />
      </form>
    </Form>
  );
}

const meta = {
  title: "UI/FormItemTwoColumns",
  component: FormItemTwoColumns,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Two-column form row layout. Use `.Left` / `.Right` for the two columns, `.Label` and `.Description` for the left-side copy.",
      },
    },
  },
} satisfies Meta<typeof FormItemTwoColumns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <FormItemTwoColumnsDemo />,
};
