import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState } from "react";

import { useAssistantNotifications } from "../../hooks/use-assistant-notifications";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import { Toaster, toast } from "./sonner";
import { Textarea } from "./textarea";
import { VigletAssistant, type VigletAssistantMessage } from "./viglet-assistant";
import type { VigletAvatarState } from "./viglet-avatar";

/**
 * The dock the mascot lives in.
 *
 * Collapsed it is a status light with a caption typed beside it; open it is a
 * panel with a transcript and a composer. Passing no `onSend` is what turns the
 * chat off — the composer is not rendered at all, and the dock becomes a place
 * the system reports from.
 *
 * It knows no backend. `messages`, `busy` and `onSend` are the whole contract,
 * so the product owns the endpoint, the prompt and the key. The stories below
 * answer from a local script; nothing here calls anything.
 */
const meta = {
  title: "UI/VigletAssistant",
  component: VigletAssistant,
  parameters: { layout: "fullscreen" },
  argTypes: {
    state: {
      control: "select",
      options: ["idle", "working", "success", "error", "attention"],
    },
    unread: { control: "boolean" },
    busy: { control: "boolean" },
  },
} satisfies Meta<typeof VigletAssistant>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A stage with room for the dock to sit in its corner. */
function Stage({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-[34rem] w-full overflow-hidden bg-background p-6">
      {children}
    </div>
  );
}

function Dock(props: Readonly<React.ComponentProps<typeof VigletAssistant>>) {
  return (
    <div className="absolute bottom-5 right-5">
      <VigletAssistant inline {...props} />
    </div>
  );
}

/** Collapsed: a status light, with the system's last sentence typed beside it. */
export const Collapsed: Story = {
  args: { state: "attention", caption: "Mariana Lopes, Lumen Arquitetura. Source: site form." },
  render: (args) => (
    <Stage>
      <Dock {...args} />
    </Stage>
  ),
};

/**
 * Open with no `onSend`: the dock is a status surface. There is no composer and
 * no transcript, because chat off means absent rather than disabled.
 */
export const StatusOnly: Story = {
  args: {
    state: "working",
    defaultOpen: true,
    caption: "Reindexing 1,284 documents.",
  },
  render: (args) => (
    <Stage>
      <Dock {...args} />
    </Stage>
  ),
};

/** An answer is waiting behind a collapsed dock: a slow, low orbit. */
export const Unread: Story = {
  args: { unread: true, caption: "I found three pages with no meta description." },
  render: (args) => (
    <Stage>
      <Dock {...args} />
    </Stage>
  ),
};

/* ------------------------------ the CMS demo ------------------------------ */

interface Page {
  id: number;
  title: string;
  slug: string;
  published: boolean;
}

interface Lead {
  name: string;
  org: string;
  source: string;
}

const FIRST_PAGES: Page[] = [
  { id: 1, title: "Home", slug: "/", published: true },
  { id: 2, title: "Governance and transparency", slug: "/governance", published: true },
  { id: 3, title: "Third quarter results", slug: "/q3-results", published: false },
  { id: 4, title: "", slug: "/announcement", published: false },
];

const FIRST_LEADS: Lead[] = [
  { name: "Ricardo Tavares", org: "Grupo Meridiano", source: "referral" },
  { name: "Helena Cruz", org: "Banco Atlas", source: "site form" },
];

/**
 * A stand-in for the product's assistant endpoint. A real one posts to the
 * product's own backend; this is a script, so the story stays offline and
 * deterministic.
 */
function scriptedReply(question: string, page: Page): VigletAssistantMessage {
  if (/title/i.test(question)) {
    return {
      role: "assistant",
      text: "Lead with the number. It is the part a reader scans for.",
      action: { label: "Use “Margin up 2.4 points in the third quarter”", onSelect: () => {} },
    };
  }
  if (/publish|status/i.test(question)) {
    return {
      role: "assistant",
      text: page.published
        ? `${page.slug} is published.`
        : `${page.slug} is still a draft. It needs a title before it can go out.`,
    };
  }
  return {
    role: "assistant",
    text: "I can look at this page's title, its content or the recent leads. Ask about one of those.",
  };
}

function CmsDemo() {
  const [pages, setPages] = useState(FIRST_PAGES);
  const [selectedId, setSelectedId] = useState(3);
  const [leads, setLeads] = useState(FIRST_LEADS);
  const [body, setBody] = useState(
    "Net revenue was in line with the previous quarter. Operating margin gained 2.4 percentage points, reflecting the logistics contracts renegotiated in July.",
  );

  const [state, setState] = useState<VigletAvatarState>("idle");
  const [caption, setCaption] = useState<string | null>(null);
  const [messages, setMessages] = useState<VigletAssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const [activity, setActivity] = useState(0);

  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const page = pages.find((p) => p.id === selectedId)!;

  const say = (next: VigletAvatarState, line: string, hold = 3500) => {
    clearTimeout(settleTimer.current);
    setState(next);
    setCaption(line);
    settleTimer.current = setTimeout(() => {
      setState("idle");
      setCaption(null);
    }, hold);
  };

  /**
   * Something small happened — a keystroke, a row selected. Unthrottled on
   * purpose: the avatar stamps the moment of the last bump and flares from
   * that, so a burst of keystrokes is one flare rather than a queue of them.
   */
  const nudge = () => setActivity((n) => n + 1);

  const setTitle = (title: string) => {
    nudge();
    setPages((all) => all.map((p) => (p.id === selectedId ? { ...p, title } : p)));
  };

  const publish = () => {
    if (!page.title.trim()) {
      say("error", "A title is required before publishing.", 4000);
      return;
    }
    setPages((all) => all.map((p) => (p.id === selectedId ? { ...p, published: true } : p)));
    say("success", `${page.slug} published at ${new Date().toLocaleTimeString()}.`);
  };

  const arriveLead = () => {
    const lead: Lead = { name: "Mariana Lopes", org: "Lumen Arquitetura", source: "site form" };
    setLeads((all) => [lead, ...all]);
    say("attention", `${lead.name}, ${lead.org}. Source: ${lead.source}.`, 4500);
  };

  const send = (text: string) => {
    setOpen(true);
    setMessages((all) => [...all, { role: "user", text }]);
    setBusy(true);
    clearTimeout(settleTimer.current);
    setCaption(null);
    setState("working");

    setTimeout(() => {
      const reply = scriptedReply(text, page);
      setMessages((all) => [...all, reply]);
      setBusy(false);
      setState("idle");
    }, 900);
  };

  return (
    <div className="relative grid min-h-[42rem] grid-cols-[15rem_minmax(0,1fr)] bg-background">
      <aside className="border-r border-border bg-card p-5">
        <p className="mb-5 text-sm font-semibold">Viglet</p>

        <p className="mb-2 text-xs text-muted-foreground">Pages</p>
        <div className="flex flex-col gap-0.5">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedId(p.id);
                nudge();
                say("idle", `${p.title || "Untitled"} · ${p.published ? "published" : "draft"}`, 2500);
              }}
              className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-accent ${
                p.id === selectedId ? "bg-accent" : ""
              }`}
            >
              <span className={p.title ? "" : "text-muted-foreground"}>
                {p.title || "Untitled"}
              </span>
              {p.published && <Badge variant="secondary">live</Badge>}
            </button>
          ))}
        </div>

        <Separator className="my-5" />

        <p className="mb-2 text-xs text-muted-foreground">Recent leads</p>
        <div className="flex flex-col gap-2">
          {leads.slice(0, 3).map((l) => (
            <div key={`${l.name}-${l.org}`} className="text-sm leading-tight">
              <p className="m-0">{l.name}</p>
              <p className="m-0 text-xs text-muted-foreground">{l.org}</p>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-4" onClick={arriveLead}>
          Simulate a lead
        </Button>
      </aside>

      <main className="max-w-3xl p-10">
        <p className="mb-5 text-sm text-muted-foreground">Pages / {page.slug}</p>

        <Input
          value={page.title}
          placeholder="Page title"
          aria-label="Page title"
          onChange={(event) => setTitle(event.target.value)}
          // `md:text-3xl` as well as `text-3xl`: Input sets `md:text-sm`, and a
          // media query beats a plain utility however they are ordered.
          className={`h-auto border-0 border-b border-border px-0 py-2 text-3xl font-medium shadow-none focus-visible:ring-0 md:text-3xl ${
            state === "error" && !page.title.trim() ? "border-destructive" : ""
          }`}
        />

        <p className="mb-2 mt-7 text-xs text-muted-foreground">Content</p>
        <Textarea
          value={body}
          rows={7}
          aria-label="Content"
          onChange={(event) => {
            setBody(event.target.value);
            nudge();
          }}
        />

        <div className="mt-7 flex gap-3">
          <Button onClick={publish}>Publish</Button>
          <Button variant="outline" onClick={() => send("Suggest a stronger title for this page.")}>
            Suggest a title
          </Button>
        </div>
      </main>

      <div className="absolute bottom-5 right-5">
        <VigletAssistant
          inline
          state={state}
          caption={caption}
          messages={messages}
          busy={busy}
          unread={unread}
          activity={activity}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setUnread(false);
          }}
          onSend={send}
        />
      </div>
    </div>
  );
}

/**
 * The design this was drawn from, rebuilt out of this package.
 *
 * Everything the mascot does here is driven by something a person did: publishing
 * without a title turns it to `error`, publishing turns it to `success`, a lead
 * arriving turns it to `attention`, and typing bumps `activity` so it flares
 * without changing state. Asking it something opens the panel and puts it to
 * `working` until the answer lands.
 *
 * The reply is a local script — see `scriptedReply`. A product passes its own
 * `onSend`; the package never learns where the answer comes from.
 */
export const ContentEditor: Story = {
  render: () => <CmsDemo />,
};

/* --------------------------- driven by the toasts -------------------------- */

function NotificationDemo() {
  const { state, caption, activity } = useAssistantNotifications();

  return (
    <Stage>
      <Toaster />
      <div className="max-w-xl">
        <p className="mb-1 text-sm font-semibold">Driven by the toasts</p>
        <p className="mb-5 max-w-md text-sm text-muted-foreground">
          Nothing below sets the mascot's state. Each button raises an ordinary{" "}
          <code>toast</code>, and <code>useAssistantNotifications</code> reads the
          Toaster back. Dismiss them all and it returns to idle on its own.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("/q3-results published at 14:02.")}>
            success
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.error("Could not reach the publishing service.")}>
            error
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.warning("Two pages have no meta description.")}>
            warning
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("Mariana Lopes, Lumen Arquitetura.")}>
            info
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.loading("Reindexing 1,284 documents.")}>
            loading
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toast.dismiss()}>
            dismiss all
          </Button>
        </div>

        <p className="mt-5 text-xs text-muted-foreground">
          state: <code>{state}</code> · activity: <code>{activity}</code>
        </p>
      </div>

      <Dock state={state} caption={caption} />
    </Stage>
  );
}

/**
 * The mascot moved by `toast` alone.
 *
 * `useAssistantNotifications` reads sonner's live list rather than wrapping
 * `toast`, so a product calling sonner from a module that never imported the
 * hook still moves the mascot — which is the point. Work in progress outranks an
 * outcome, a failure outranks a success, and an empty list is idle.
 *
 * The caption is the toast's own title when it is a string, so a product that
 * already writes good toast copy gets the mascot's voice for free.
 */
export const FromNotifications: Story = {
  render: () => <NotificationDemo />,
};
