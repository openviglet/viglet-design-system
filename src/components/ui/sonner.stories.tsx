import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "./button";
import { Toaster, toast } from "./sonner";

const meta = {
  title: "UI/Sonner",
  component: Toaster,
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <Button onClick={() => toast("Event created", { description: "Sunday, December 03, 2023 at 9:00 AM" })}>
        Show toast
      </Button>
      <Toaster {...args} />
    </div>
  ),
};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => toast("Default toast")}>
          Default
        </Button>
        <Button variant="outline" onClick={() => toast.success("Saved successfully")}>
          Success
        </Button>
        <Button variant="outline" onClick={() => toast.info("Just so you know")}>
          Info
        </Button>
        <Button variant="outline" onClick={() => toast.warning("Heads up")}>
          Warning
        </Button>
        <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
          Error
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const id = toast.loading("Uploading...");
            setTimeout(() => toast.success("Upload complete", { id }), 1500);
          }}
        >
          Loading
        </Button>
      </div>
      <Toaster {...args} />
    </div>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-4">
      <Button
        onClick={() =>
          toast("File deleted", {
            description: "report-2026-04.pdf moved to trash",
            action: {
              label: "Undo",
              onClick: () => toast.success("Restored"),
            },
          })
        }
      >
        Delete file
      </Button>
      <Toaster {...args} />
    </div>
  ),
};
