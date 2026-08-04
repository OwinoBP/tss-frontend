import { Section } from "@/components/layout/Section";
import { ProductGallerySkeleton } from "@/components/commerce/ProductGallery";
import { ProductInfoSkeleton } from "@/components/commerce/ProductInfo";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next's file-based Suspense boundary for this route's async data fetch —
 * same grid shape as the real page so nothing visibly jumps once content
 * arrives. The breadcrumb trail can't be meaningfully skeletoned (its
 * final segment is the product title, not known yet) — a short muted bar
 * stands in for it instead of guessing content.
 */
export default function ProductDetailLoading() {
  return (
    <Section>
      <Skeleton className="mb-8 h-4 w-48" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallerySkeleton />
        <ProductInfoSkeleton />
      </div>
    </Section>
  );
}
