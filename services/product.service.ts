import { query } from "@/lib/apollo/rsc-client";
import {
  PRODUCTS_QUERY,
  type ProductsQueryPageInfo,
} from "@/graphql/queries/products.query";
import { mapWooCommerceProductToMusicProduct } from "@/services/mappers/product.mapper";
import { storeConfig } from "@/lib/config";
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
// getProducts/getProductsPage are implemented below. The rest wait on
// queries this pass doesn't build (a single-product query, a search
// query) — see docs/api/product-query.md.

export interface GetProductsParams {
  first?: number;
  after?: string | null;
}

export interface ProductsPage {
  products: MusicProduct[];
  pageInfo: ProductsQueryPageInfo;
}

/**
 * Fetches a page of products, mapped to MusicProduct, alongside pagination
 * metadata (`hasNextPage`/`endCursor`) — for any UI that needs to render a
 * "next page" affordance (feature/product-catalog and, by the same
 * pattern, any future listing: category pages, search results,
 * collections). Uses the request-scoped RSC Apollo client
 * (lib/apollo/rsc-client.ts) — intended for Server Components.
 *
 * WPGraphQL's `products.nodes` is typed `[Product!]!` (the shared
 * interface implemented by four concrete product types); only nodes that
 * are actually `SimpleProduct` carry the fields this query selected, so
 * anything else is filtered out here before mapping. See
 * graphql/queries/products.query.ts and docs/api/product-query.md.
 */
export async function getProductsPage(
  params: GetProductsParams = {},
): Promise<ProductsPage> {
  const { data } = await query({
    query: PRODUCTS_QUERY,
    variables: {
      first: params.first ?? storeConfig.catalog.productsPerPage,
      after: params.after ?? null,
    },
    errorPolicy: "none",
  });

  return {
    products: data.products.nodes
      .filter((node) => node.__typename === "SimpleProduct")
      .map(mapWooCommerceProductToMusicProduct),
    pageInfo: data.products.pageInfo,
  };
}

/**
 * Same fetch as `getProductsPage`, without pagination metadata — for
 * callers that only ever want a flat list (e.g. a future homepage
 * "featured products" rail). A thin wrapper, not a second query: keeps
 * one place that actually talks to Apollo/WPGraphQL for product listings.
 */
export async function getProducts(
  params: GetProductsParams = {},
): Promise<MusicProduct[]> {
  return (await getProductsPage(params)).products;
}

// export async function getFeaturedProducts(): Promise<MusicProduct[]> { ... }

// export async function getProduct(slug: string): Promise<MusicProduct> { ... }

// export async function searchProducts(term: string): Promise<MusicProduct[]> { ... }
