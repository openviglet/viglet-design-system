import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * Whether a `TooltipProvider` of this package is above. Radix keeps its own
 * provider context to itself, so this is how a `Tooltip` knows not to mount one.
 */
const TooltipProvided = React.createContext(false)

/**
 * Sets how long a pointer rests before the tooltips beneath it open, with no delay
 * unless `delayDuration` says otherwise.
 *
 * A `Tooltip` needs none above it and mounts its own when there is none.
 */
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipProvided value={true}>
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={delayDuration}
        {...props}
      />
    </TooltipProvided>
  )
}

/**
 * A short label that appears beside an element on hover or keyboard focus, composed
 * with `TooltipTrigger` and `TooltipContent`.
 *
 * Put nothing a reader needs only in it. Content to read or act in is `Popover`.
 */
function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  // VDS154 — this used to wrap every root in a provider of its own, whose zero
  // delay was the nearest and so the one Radix read. A provider placed above it,
  // like the nav rail's 200ms, set a delay nothing reached. Upstream shadcn does
  // the same, which is why it read as deliberate.
  const provided = React.useContext(TooltipProvided)
  const root = <TooltipPrimitive.Root data-slot="tooltip" {...props} />
  return provided ? root : <TooltipProvider>{root}</TooltipProvider>
}

/**
 * The element a `Tooltip` labels. Pass `asChild` to use your own.
 */
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

/**
 * The tooltip's bubble, with an arrow, portalled beside its trigger.
 */
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
