import { Section } from "@/components/layout/Section";
import { ProductGridSkeleton } from "@/components/commerce/ProductGrid";
import { SearchForm } from "./SearchForm";

/**
 * Next's file-based Suspense boundary for app/search/page.tsx — shown
 * automatically while getProductsPage resolves. Same Section heading and
 * SearchForm as the real page (matching app/products/loading.tsx's
 * "loading state shares real layout" convention, extended here to the form
 * as well as the grid) so nothing appears/disappears once the real page
 * replaces this. Can't know the submitted query term here (loading.tsx has
 * no access to searchParams), so the form renders without a prefilled
 * value — a brief, cosmetic-only mismatch with the real page's
 * `defaultQuery`, resolved the instant the real page mounts.
 *
 * `ProductFilters` isn't rendered here, unlike app/products/loading.tsx:
 * the real page only shows it once a query is active (`query ? <ProductFilters
 * .../> : null`), and this loading state — reached before a query is even
 * known — can't tell which branch applies. Omitting it matches what the
 * real page renders during its own "no query yet" state, not a gap.
 */
export default function SearchLoading() {
  return (
    <Section heading="Search">
      <SearchForm />
      <ProductGridSkeleton className="mt-8" />
    </Section>
  );
}
