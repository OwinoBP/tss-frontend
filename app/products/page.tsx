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

interface ProductsPageProps {
  searchParams: Promise<ProductFilterParams & { after?: string }>;
}

/**
 * `after` (page 2+) and any active filter/sort are intentionally not
 * indexed: WPGraphQL's connection only exposes forward cursor pagination
 * (see product.service.ts), so there's no stable numbered URL per page to
 * offer search engines — `/products` (page one, unfiltered) is the
 * canonical entry point. A filtered/sorted result has the same problem as
 * a paginated one: no stable per-combination URL worth indexing
 * separately (feature/filtering-and-sorting extends this rule from just
 * `after` — see docs/decisions.md).
 */
export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const { after, ...filterParams } = await searchParams;
  const filterState = parseProductFilterParams(filterParams);
  const nonCanonical = Boolean(after) || hasActiveProductFilters(filterState);

  return {
    title: "Products",
    description:
      "Browse sample packs, drum kits, MIDI packs, presets, one-shots, and construction kits.",
    ...(nonCanonical
      ? {
          alternates: { canonical: routes.products.index },
          robots: { index: false, follow: true },
        }
      : {}),
  };
}

/**
 * The storefront's first real catalog page — wires together every layer
 * built so far: service -> presentation mapper -> ProductGrid. Intended
 * as the reusable pattern for every future listing page (category, brand,
 * search, collections) described in docs/decisions.md, not just this one
 * route.
 *
 * No try/catch here on purpose: a thrown fetch error propagates to
 * app/products/error.tsx (Next's error boundary), which is the
 * architecturally correct place for it — this component only handles the
 * *valid* empty-results case, which isn't an error.
 */
export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { after, ...filterParams } = await searchParams;
  const filterState = parseProductFilterParams(filterParams);
  const { products, pageInfo } = await getProductsPage({
    after: after ?? null,
    where: productFilterStateToWhere(filterState),
  });

  return (
    <Section heading="Products">
      <ProductFilters action={routes.products.index} state={filterState} className="mb-8" />

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {hasActiveProductFilters(filterState)
            ? "No products match these filters."
            : "No products found."}
        </p>
      ) : (
        <>
          <ProductGrid products={products.map(toProductCard)} />
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link
                  href={`${routes.products.index}${buildListingQueryString(filterState, { after: pageInfo.endCursor })}`}
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
