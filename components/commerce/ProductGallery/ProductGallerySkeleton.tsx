import { Skeleton } from "@/components/ui/skeleton";

/**
 * ProductGallery's loading state. Fixed at 4 secondary placeholders
 * (rather than trying to guess a real count ahead of time) — an
 * approximation is fine here since, unlike ProductGridSkeleton, a
 * mismatched count doesn't cause a multi-column reflow, just a shorter
 * strip appearing/disappearing.
 */
export function ProductGallerySkeleton() {
  return (
    <div role="status" aria-label="Loading product images" className="flex flex-col gap-4">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
