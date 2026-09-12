import { GripVertical } from "lucide-react"
import { Group, Panel, Separator } from "react-resizable-panels"

import { cn } from "@/lib/utils"

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof Group>) {
  return (
    <Group
      data-slot="resizable-panel-group"
      // VDS126 — no orientation variant here. The group used to carry
      // `data-[panel-group-orientation=vertical]:flex-col`, keyed to an
      // attribute react-resizable-panels 4 does not write; the library sets
      // `flex-flow` inline from its own `orientation` prop, so the rule was
      // both dead and unnecessary.
      className={cn("flex h-full w-full", className)}
      {...props}
    />
  )
}

function ResizablePanel({
  overflowHidden,
  className,
  ...props
}: React.ComponentProps<typeof Panel> & { overflowHidden?: boolean }) {
  return (
    <Panel
      data-slot="resizable-panel"
      className={cn(overflowHidden && "[&>div]:overflow-hidden!", className)}
      style={overflowHidden ? { overflow: "hidden" } : undefined}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}) {
  return (
    <Separator
      data-slot="resizable-handle"
      /*
       * VDS126 — keyed to `aria-orientation`, which is the only thing on this
       * element that says which way the group runs.
       *
       * Every rule here used to read `data-panel-group-orientation`, and the
       * grip's read `data-panel-group-direction` on top of that. Version 4 of
       * react-resizable-panels writes neither: it lays the group out with inline
       * styles and labels the separator for ARIA. So none of these fired, and a
       * handle in a vertical group kept `w-px` — a drag target one pixel wide
       * and sixteen tall, which is the grip's own height and nothing else.
       *
       * The separator's axis is the inverse of the group's, by ARIA's own
       * convention: a vertical group is divided by a horizontal separator. That
       * inversion is why this reads `horizontal` where the old rules read
       * `vertical`, and it is the easiest thing here to "correct" wrongly.
       */
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:-left-2 after:-right-2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden",
        "[&[aria-orientation=horizontal]]:h-px [&[aria-orientation=horizontal]]:w-full [&[aria-orientation=horizontal]]:after:inset-x-0 [&[aria-orientation=horizontal]]:after:-top-2 [&[aria-orientation=horizontal]]:after:-bottom-2 [&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVertical className="size-2.5" />
        </div>
      )}
    </Separator>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
