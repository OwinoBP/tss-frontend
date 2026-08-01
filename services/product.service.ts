import { query } from "@/lib/apollo/rsc-client";
import { PRODUCTS_QUERY } from "@/graphql/queries/products.query";
import { mapWooCommerceProductToMusicProduct } from "@/services/mappers/product.mapper";
import type { MusicProduct } from "@/types/music-product";

// Product service
//
// The single entry point UI code uses to read WooCommerce product data.
// Components must call these methods instead of executing GraphQL queries
// directly — that's what keeps data-fetching logic out of the component
// tree and behind one boundary:
//
//   React Components -> Services -> Apollo Client -> GraphQL -> WordPress
//
// getProducts is implemented below. The rest wait on queries this pass
// doesn't build (a single-product query, a search query) — see
// docs/api/product-query.md.

const DEFAULT_PAGE_SIZE = 20;

export interface GetProductsParams {
  first?: number;
  after?: string | null;
}

/**
 * Fetches a page of products and maps them to MusicProduct. Uses the
 * request-scoped RSC Apollo client (lib/apollo/rsc-client.ts) — intended
 * for Server Components.
 *
 * WPGraphQL's `products.nodes` is typed `[Product!]!` (the shared
 * interface implemented by four concrete product types); only nodes that
 * are actually `SimpleProduct` carry the fields this query selected, so
 * anything else is filtered out here before mapping. See
 * graphql/queries/products.query.ts and docs/api/product-query.md.
 */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<MusicProduct[]> {
  const { data } = await query({
    query: PRODUCTS_QUERY,
    variables: {
      first: params.first ?? DEFAULT_PAGE_SIZE,
      after: params.after ?? null,
    },
    errorPolicy: "none",
  });

  return data.products.nodes
    .filter((node) => node.__typename === "SimpleProduct")
    .map(mapWooCommerceProductToMusicProduct);
}

// export async function getFeaturedProducts(): Promise<MusicProduct[]> { ... }

// export async function getProduct(slug: string): Promise<MusicProduct> { ... }

// export async function searchProducts(term: string): Promise<MusicProduct[]> { ... }
