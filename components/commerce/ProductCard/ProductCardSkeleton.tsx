import { Card, CardContent } from "@/components/ui/card";

/**
 * Loading placeholder matching ProductCard's exact shape and spacing, so
 * the loading -> loaded transition doesn't reflow. Per
 * docs/design-system.md's "Motion principles": skeleton shapes (not a
 * spinner) using the Muted Fill token, and `motion-safe:` only, so the
 * pulse respects `prefers-reduced-motion` automatically. Purely
 * decorative — `aria-hidden`; the loading region's accessible
 * announcement lives on `ProductGridSkeleton`'s wrapper.
 */
export function ProductCardSkeleton() {
  return (
    <Card aria-hidden="true" className="gap-4 overflow-hidden py-0">
      <div className="aspect-square w-full bg-muted motion-safe:animate-pulse" />
      <CardContent className="flex flex-col pb-4">
        <div className="flex flex-col gap-1">
          <div className="h-5 w-3/4 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted motion-safe:animate-pulse" />
          <div className="h-3 w-1/3 rounded bg-muted motion-safe:animate-pulse" />
        </div>
        <div className="mt-3 h-4 w-1/4 rounded bg-muted motion-safe:animate-pulse" />
      </CardContent>
    </Card>
  );
}
