import { Section } from "@/components/layout/Section";
import { ProductGridSkeleton } from "@/components/commerce/ProductGrid";
import { ProductFilters } from "@/components/commerce/ProductFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/lib/config";
import { parseProductFilterParams } from "@/lib/product-filters";

/**
 * Next's file-based Suspense boundary for app/categories/[slug]/page.tsx —
 * shown automatically while getCategory/getProductsPage resolve. Neither
 * the category name (the Section heading) nor the breadcrumb trail's final
 * segments are known yet here, so short muted bars stand in for both,
 * matching app/products/[slug]/loading.tsx's precedent for the same
 * problem. `slug` isn't known yet either, so `ProductFilters`' `action`
 * falls back to `routes.categories.index` — cosmetic only, since this
 * loading state is replaced before the form could ever be submitted from
 * here (feature/filtering-and-sorting, matching app/products/loading.tsx's
 * "loading state shares real layout" convention extended to ProductFilters).
 */
export default function CategoryLoading() {
  return (
    <Section>
      <Skeleton className="mb-8 h-4 w-48" />
      <Skeleton className="mb-8 h-8 w-64" />
      <ProductFilters
        action={routes.categories.index}
        state={parseProductFilterParams({})}
        className="mb-8"
      />
      <ProductGridSkeleton />
    </Section>
  );
}
