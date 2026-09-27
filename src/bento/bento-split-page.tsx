import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { type LayoutStorage, useDefaultLayout } from "react-resizable-panels";

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface BentoSplitPageProps {
  /** The pane read first, on the left: a form, a source text. */
  primary: ReactNode;
  /** The pane read beside it: a preview, a translation. */
  secondary: ReactNode;
  /** Each pane's name, already translated: its region's label, and its tab at phone width. */
  primaryLabel: string;
  secondaryLabel: string;
  /**
   * Remembers the ratio a reader dragged to, per viewer, in browser storage under
   * this key. Omitted, every visit starts at `defaultRatio`.
   */
  storageKey?: string;
  /** The primary pane's share of the width, in percent, before anyone drags. */
  defaultRatio?: number;
  className?: string;
}

const PANES = ["primary", "secondary"];

/**
 * Browser storage that never throws. The ratio is a convenience, so a private
 * window or blocked storage starts at the default instead of breaking the page.
 */
const quietStorage: LayoutStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not remembered this time; the layout itself is unaffected.
    }
  },
};

/** Where a split with no `storageKey` keeps its ratio: nowhere. */
const noStorage: LayoutStorage = { getItem: () => null, setItem: () => {} };

/**
 * VDS173 — the two-pane page shape: a form and its preview, or a source and its
 * translation, read side by side.
 *
 * It sits under the page's one hero, inside the shell's `wide` column, and each
 * pane scrolls on its own so the fields and what they change stay in view
 * together. The reader drags the ratio, and `storageKey` remembers it per viewer.
 * At phone width the two panes become one with a labelled switch between them.
 * The second pane never silently disappears, and neither pane unmounts, so a form
 * keeps what was typed while its preview is shown.
 */
export function BentoSplitPage({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  storageKey,
  defaultRatio = 50,
  className,
}: Readonly<BentoSplitPageProps>) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const remembered = useDefaultLayout({
    id: storageKey ?? "bento-split-page",
    panelIds: PANES,
    storage: storageKey ? quietStorage : noStorage,
  });

  if (isMobile) {
    return (
      <Tabs data-slot="bento-split-page" defaultValue="primary" className={cn("flex flex-col gap-3", className)}>
        <TabsList aria-label={t("bento.split.switch", { defaultValue: "Show" })} className="self-start">
          <TabsTrigger value="primary">{primaryLabel}</TabsTrigger>
          <TabsTrigger value="secondary">{secondaryLabel}</TabsTrigger>
        </TabsList>
        <TabsContent value="primary" forceMount className="data-[state=inactive]:hidden">
          {primary}
        </TabsContent>
        <TabsContent value="secondary" forceMount className="data-[state=inactive]:hidden">
          {secondary}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div
      data-slot="bento-split-page"
      // The height the panes scroll within: the viewport under the shell's header
      // and the page's hero. A product with a taller hero re-keys the property.
      className={cn("h-[var(--bento-split-height,calc(100dvh-12rem))] min-h-80", className)}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={remembered.defaultLayout}
        onLayoutChanged={remembered.onLayoutChanged}
      >
        <ResizablePanel id="primary" defaultSize={`${defaultRatio}`} minSize="25">
          <section aria-label={primaryLabel} className="h-full overflow-y-auto pr-3">
            {primary}
          </section>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel id="secondary" defaultSize={`${100 - defaultRatio}`} minSize="25">
          <section aria-label={secondaryLabel} className="h-full overflow-y-auto pl-3">
            {secondary}
          </section>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
