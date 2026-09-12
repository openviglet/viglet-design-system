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
/**
 * Not `StoryObj<typeof meta>`. `Form` is react-hook-form's `FormProvider`, so
 * its props are the whole form API — a story cannot supply those as args and
 * should not: what it shows is a form composed around a real `useForm`. Binding
 * the stories to the component's props would only demand eighteen fields nobody
 * reads (VDS119).
 */
type Story = StoryObj;

export const Default: Story = {
  render: () => <FormDemo />,
};
