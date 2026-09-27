import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconFileText } from "@tabler/icons-react";
import { useState } from "react";

import { BentoFormSection } from "./bento-form-section";
import { BentoSplitPage } from "./bento-split-page";

/**
 * The two-pane page shape: a form beside what it changes. Drag the handle to
 * change the ratio; narrow the viewport below 768px and the panes become one
 * with a switch between them.
 */
const meta = {
  title: "Bento/Split page",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Editor() {
  const [title, setTitle] = useState("Third quarter results");
  const [body, setBody] = useState("Revenue was flat and the operating margin rose 2.4 points.");
  return (
    <div style={{ ["--bento-split-height" as string]: "28rem" }}>
      <BentoSplitPage
        primaryLabel="Post"
        secondaryLabel="Preview"
        storageKey="story-split-page"
        primary={
          <BentoFormSection title="Content" icon={IconFileText} tone="blue">
            <label className="flex flex-col gap-1 text-sm">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Body
              <textarea
                value={body}
                rows={6}
                onChange={(event) => setBody(event.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1"
              />
            </label>
          </BentoFormSection>
        }
        secondary={
          <article className="flex flex-col gap-2">
            <h2 className="m-0 text-xl font-semibold">{title}</h2>
            <p className="m-0 text-sm leading-relaxed">{body}</p>
          </article>
        }
      />
    </div>
  );
}

export const FormAndPreview: Story = {
  render: () => <Editor />,
};
