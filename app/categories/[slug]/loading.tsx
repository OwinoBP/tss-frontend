import { Section } from "@/components/layout/Section";
import { ProductGridSkeleton } from "@/components/commerce/ProductGrid";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Next's file-based Suspense boundary for app/categories/[slug]/page.tsx —
 * shown automatically while getCategory/getProductsPage resolve. Neither
 * the category name (the Section heading) nor the breadcrumb trail's final
 * segments are known yet here, so short muted bars stand in for both,
 * matching app/products/[slug]/loading.tsx's precedent for the same
 * problem.
 */
export default function CategoryLoading() {
  return (
    <Section>
      <Skeleton className="mb-8 h-4 w-48" />
      <Skeleton className="mb-8 h-8 w-64" />
      <ProductGridSkeleton />
    </Section>
  );
}
