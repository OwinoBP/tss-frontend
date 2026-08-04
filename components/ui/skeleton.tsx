import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Generic loading placeholder — a muted, pulsing block. Domain-agnostic
 * (no product/commerce knowledge), matching the rest of `components/ui/`.
 * `motion-safe:` keeps the pulse off entirely under
 * `prefers-reduced-motion`, per docs/design-system.md's Motion principles.
 * Purely decorative — always `aria-hidden`; the region using this should
 * carry its own `role="status"`/`aria-label` once, not per skeleton block.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("rounded-md bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  )
}

export { Skeleton }
