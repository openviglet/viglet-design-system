import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { BentoCalendar, type BentoCalendarEntry, type BentoCalendarView } from "./bento-calendar";

/**
 * A month or a week of what is scheduled. Drag an entry to another day, or reach
 * it from the keyboard: Enter enters a day, Space picks the entry up, the arrows
 * choose a day and Enter drops it. The product owns the entries and the write.
 */
const meta = {
  title: "Bento/Calendar",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ZONE = "America/Sao_Paulo";

const SCHEDULED: BentoCalendarEntry[] = [
  { id: "a", start: "2026-09-03T12:00:00Z", label: "Quarterly results" },
  { id: "b", start: "2026-09-10T17:00:00Z", label: "Product launch post", tone: "on" },
  { id: "c", start: "2026-09-10T20:30:00Z", label: "Newsletter" },
  { id: "d", start: "2026-09-17T13:00:00Z", label: "Legal review due", tone: "warn" },
  { id: "e", start: "2026-09-24T15:00:00Z", label: "Embargo lifts", tone: "error" },
];

function Scheduled({ defaultView }: Readonly<{ defaultView: BentoCalendarView }>) {
  const [entries, setEntries] = useState(SCHEDULED);
  return (
    <BentoCalendar
      entries={entries}
      defaultView={defaultView}
      defaultDate="2026-09-10T12:00:00Z"
      timeZone={ZONE}
      onEntryMove={(id, start) => setEntries((all) => all.map((e) => (e.id === id ? { ...e, start } : e)))}
    />
  );
}

export const Month: Story = {
  render: () => <Scheduled defaultView="month" />,
};

export const Week: Story = {
  render: () => <Scheduled defaultView="week" />,
};
