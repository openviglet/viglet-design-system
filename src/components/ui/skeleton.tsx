import { cn } from "@/lib/utils"

/**
 * A pulsing placeholder block standing in for content still loading. `LoadProvider`
 * lays out a page of them.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
