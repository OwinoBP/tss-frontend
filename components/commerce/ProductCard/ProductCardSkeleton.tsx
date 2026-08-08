import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholder matching ProductCard's exact shape and spacing, so
 * the loading -> loaded transition doesn't reflow. Purely decorative —
 * the loading region's accessible announcement lives on
 * `ProductGridSkeleton`'s wrapper, not here. Carries the same resting
 * shadow as the loaded card so that transition doesn't visibly "pop" in
 * elevation either.
 */
export function ProductCardSkeleton() {
  return (
    <Card className="gap-4 overflow-hidden py-0 shadow-(--elevation-md)">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="flex flex-col pb-4">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="mt-3 h-4 w-1/4" />
      </CardContent>
    </Card>
  );
}
