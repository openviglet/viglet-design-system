import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "./button";
import { VigletAvatar, type VigletAvatarState } from "./viglet-avatar";

/**
 * The Viglet mascot: a small sun that reports what the system is doing.
 *
 * It is one canvas and no dependency — the faceted core is an icosahedron at
 * three's detail 2, 180 triangles flat-shaded into a 2D context. The states are
 * named for the toast kinds, so a product that already reports through `toast`
 * has nothing to translate when it drives the mascot from the same place.
 *
 * Nothing here is drawn at random: the ember field follows from `seed`, so the
 * same props always produce the same picture. Pass a changing `seed` for a
 * fresh field per visit.
 *
 * The mascot is decorative (`aria-hidden`): whatever wraps it owns the
 * accessible name and the words.
 */
const meta = {
  title: "UI/VigletAvatar",
  component: VigletAvatar,
  tags: ["autodocs"],
  argTypes: {
    state: {
      control: "select",
      options: ["idle", "working", "success", "error", "attention"],
    },
    size: { control: { type: "range", min: 64, max: 256, step: 8 } },
    compact: { control: "boolean" },
    unread: { control: "boolean" },
    paused: { control: "boolean" },
    seed: { control: { type: "number" } },
  },
  args: { state: "idle", size: 160 },
} satisfies Meta<typeof VigletAvatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES: { state: VigletAvatarState; caption: string }[] = [
  { state: "idle", caption: "Idle — nothing is happening" },
  { state: "working", caption: "Working — an orbit, and a travelling arc" },
  { state: "success", caption: "Success — a swell and a pulse outward" },
  { state: "error", caption: "Error — the light goes out, it does not turn red" },
  { state: "attention", caption: "Attention — a ring rises from below" },
];

export const Default: Story = {};

/**
 * The five states side by side. `error` is the one worth looking at twice: it
 * darkens rather than flashing scarlet, because the toast beside it is already
 * saying so in words and two alarms are one too many.
 */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6">
      {STATES.map(({ state, caption }) => (
        <figure key={state} className="m-0 flex w-52 flex-col items-center gap-2">
          <VigletAvatar state={state} size={144} />
          <figcaption className="text-center text-xs text-muted-foreground">
            {caption}
          </figcaption>
        </figure>
      ))}
    </div>
  ),
};

/**
 * Compact pulls the camera in and drops the pool of light on the ground: the
 * form for a collapsed dock, where the mascot is a light in the corner rather
 * than an object standing on a surface.
 */
export const Compact: Story = {
  args: { compact: true, size: 120 },
};

/**
 * `unread` holds a slow orbit while the dock is collapsed — an answer is
 * waiting. It is deliberately dimmer and slower than `working`: one says the
 * system is busy, the other that it has finished and you have not looked.
 */
export const Unread: Story = {
  args: { compact: true, unread: true, size: 120 },
};

/**
 * `paused` freezes the mascot on one frame, for a product that offers its own
 * motion switch. A reader whose system asks for reduced motion gets this
 * without the prop.
 */
export const Paused: Story = {
  args: { paused: true },
};

/**
 * Driving it the way a product does: the state comes from what just happened,
 * and `activity` is bumped to make the mascot react to something smaller than a
 * state change — a keystroke, a row selected.
 */
function DrivenDemo() {
  const [state, setState] = useState<VigletAvatarState>("idle");
  const [activity, setActivity] = useState(0);

  return (
    <div className="flex flex-col items-start gap-4">
      <VigletAvatar state={state} activity={activity} size={168} />
      <div className="flex flex-wrap gap-2">
        {STATES.map(({ state: next }) => (
          <Button
            key={next}
            variant={state === next ? "default" : "outline"}
            size="sm"
            onClick={() => setState(next)}
          >
            {next}
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setActivity((n) => n + 1)}>
          nudge
        </Button>
      </div>
    </div>
  );
}

export const Driven: Story = {
  render: () => <DrivenDemo />,
};
