import { ProductCardSkeleton } from "@/components/commerce/ProductCard";
import { PRODUCT_GRID_CLASSNAME, productGridStyle } from "./product-grid-layout";
import { cn } from "@/lib/utils";

export interface ProductGridSkeletonProps {
  /** Placeholder card count — match the real page size so the loading layout doesn't jump when content arrives. @default 8 */
  count?: number;
  className?: string;
}

/**
 * `ProductGrid`'s loading state — same grid layout, `ProductCardSkeleton`
 * in place of real cards. Used by `app/products/loading.tsx` (Next.js's
 * file-based Suspense boundary) and reusable by any future listing page
 * built the same way (category, search, collections).
 *
 * `role="status"`/`aria-label` announces the loading state to assistive
 * tech once, at the region level — individual skeleton cards stay
 * `aria-hidden` (see ProductCardSkeleton) so nothing inside is announced
 * eight separate times.
 */
export function ProductGridSkeleton({ count = 8, className }: ProductGridSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading products"
      style={productGridStyle()}
      className={cn(PRODUCT_GRID_CLASSNAME, className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
