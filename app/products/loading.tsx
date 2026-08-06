import { Section } from "@/components/layout/Section";
import { ProductGridSkeleton } from "@/components/commerce/ProductGrid";
import { ProductFilters } from "@/components/commerce/ProductFilters";
import { routes } from "@/lib/config";
import { parseProductFilterParams } from "@/lib/product-filters";

/**
 * Next's file-based Suspense boundary for app/products/page.tsx's async
 * data fetch — shown automatically while getProductsPage resolves. Same
 * Section heading and ProductFilters as the real page (extending the
 * existing "loading state shares real layout" convention —
 * ProductGridSkeleton, SearchForm — to ProductFilters too) so nothing
 * appears/disappears once the real page replaces this. Can't know the
 * submitted filter state here (loading.tsx has no access to searchParams),
 * so the form renders with the unfiltered default — a brief,
 * cosmetic-only mismatch resolved the instant the real page mounts.
 */
export default function ProductsLoading() {
  return (
    <Section heading="Products">
      <ProductFilters
        action={routes.products.index}
        state={parseProductFilterParams({})}
        className="mb-8"
      />
      <ProductGridSkeleton />
    </Section>
  );
}
