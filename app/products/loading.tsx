import { Section } from "@/components/layout/Section";
import { ProductGridSkeleton } from "@/components/commerce/ProductGrid";

/**
 * Next's file-based Suspense boundary for app/products/page.tsx's async
 * data fetch — shown automatically while getProductsPage resolves. Same
 * Section heading as the real page so the shell doesn't visibly jump when
 * the real content replaces this.
 */
export default function ProductsLoading() {
  return (
    <Section heading="Products">
      <ProductGridSkeleton />
    </Section>
  );
}
