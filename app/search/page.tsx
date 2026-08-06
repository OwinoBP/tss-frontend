import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProductsPage } from "@/services/product.service";
import { toProductCard } from "@/components/commerce/ProductCard";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { ProductFilters } from "@/components/commerce/ProductFilters";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/config";
import {
  buildListingQueryString,
  hasActiveProductFilters,
  parseProductFilterParams,
  productFilterStateToWhere,
  type ProductFilterParams,
} from "@/lib/product-filters";
import { SearchForm } from "./SearchForm";

interface SearchPageProps {
  searchParams: Promise<ProductFilterParams & { q?: string; after?: string }>;
}

/**
 * Every state of this page is `noindex` — internal site search results are
 * conventionally kept out of the index (thin/duplicate content relative to
 * /products, which already carries the indexable catalog), unlike
 * app/products, which indexes its own page one. See docs/decisions.md.
 */
export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: query
      ? `Products matching "${query}".`
      : "Search sample packs, drum kits, MIDI packs, presets, one-shots, and construction kits.",
    robots: { index: false, follow: true },
  };
}

/**
 * The Listing Page pattern's second real instance (see docs/architecture.md,
 * "Page architecture patterns" and docs/decisions.md, "Product Search") —
 * same service -> presentation mapper -> ProductGrid pipeline as
 * app/products, with `getProductsPage`'s `where.search` as the only new
 * moving part. A blank/whitespace `q` never reaches the service at all —
 * "no query submitted" and "query, zero results" are different valid
 * states, handled as separate conditionals below, neither routed through
 * error.tsx. feature/filtering-and-sorting adds the same price/sale/sort
 * filters app/products and app/categories/[slug] now have, composed with
 * `q` — `ProductFilters` carries `q` as a hidden field so submitting a
 * filter doesn't lose the active search term.
 *
 * No try/catch here on purpose, matching app/products/page.tsx: a thrown
 * fetch error propagates to app/search/error.tsx.
 */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, after, ...filterParams } = await searchParams;
  const query = q?.trim() ?? "";
  const filterState = parseProductFilterParams(filterParams);

  const { products, pageInfo } = query
    ? await getProductsPage({
        where: { search: query, ...productFilterStateToWhere(filterState) },
        after: after ?? null,
      })
    : { products: [], pageInfo: { hasNextPage: false, endCursor: null } };

  return (
    <Section heading="Search">
      <SearchForm defaultQuery={query} />

      {query ? (
        <ProductFilters
          action={routes.searchPath()}
          state={filterState}
          hiddenFields={{ q: query }}
          className="mt-8"
        />
      ) : null}

      {!query ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Enter a search term to find products.
        </p>
      ) : products.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {hasActiveProductFilters(filterState)
            ? `No products match these filters for "${query}".`
            : `No products found for "${query}".`}
        </p>
      ) : (
        <>
          <ProductGrid products={products.map(toProductCard)} className="mt-8" />
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link
                  href={`${routes.searchPath()}${buildListingQueryString(filterState, { q: query, after: pageInfo.endCursor })}`}
                >
                  Next
                  <ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
