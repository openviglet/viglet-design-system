import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";

import { Button } from "./button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { Input } from "./input";

type DemoValues = {
  username: string;
  email: string;
};

function FormDemo() {
  const form = useForm<DemoValues>({
    defaultValues: { username: "", email: "" },
    mode: "onSubmit",
  });

  const onSubmit = (values: DemoValues) => {
    // eslint-disable-next-line no-console
    console.log("submit", values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-80 space-y-4"
      >
        <FormField
          control={form.control}
          name="username"
          rules={{ required: "Username is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          rules={{
            required: "Email is required",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Invalid email address",
            },
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

const meta = {
  title: "UI/Form",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "`Form` is a thin re-export of react-hook-form's `FormProvider`. Use it together with `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage`.",
      },
    },
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <FormDemo />,
};
