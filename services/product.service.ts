import { query } from "@/lib/apollo/rsc-client";
import {
  PRODUCTS_QUERY,
  type ProductsQueryPageInfo,
  type ProductsQueryWhere,
} from "@/graphql/queries/products.query";
import { PRODUCT_QUERY } from "@/graphql/queries/product.query";
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
// getProducts/getProductsPage/getProduct are implemented below.

export interface GetProductsParams {
  first?: number;
  after?: string | null;
  /**
   * Passed straight through to PRODUCTS_QUERY's `where` variable — see
   * ProductsQueryWhere. feature/product-search is the first caller
   * (`{ search }`); a future category/brand listing page extends the same
   * object rather than this function growing a new flat parameter per
   * filter.
   */
  where?: ProductsQueryWhere;
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
      where: params.where,
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

/**
 * Fetches a single product by slug, or `null` if none exists.
 *
 * Uses `errorPolicy: "all"`, deliberately different from
 * `getProductsPage`'s `"none"` — confirmed live against the real
 * WPGraphQL endpoint (see graphql/queries/product.query.ts): querying a
 * nonexistent slug returns `data.product: null` *alongside* a top-level
 * GraphQL error ("No product ID was found corresponding to the slug:
 * ..."), not a clean null with no errors. With `errorPolicy: "none"`
 * (which rejects on any GraphQL error), that would surface a legitimate
 * 404 as a thrown fetch failure — indistinguishable from a real backend
 * fault, and routed to the wrong UI.
 *
 * The distinguishing signal, confirmed empirically (not assumed) by
 * logging both cases against this project's real backend: `data` is
 * *present* — `{ product: null }` — for a coherent "not found" response,
 * but *entirely absent* (`undefined`) when the request fails outright
 * (network failure, unreachable host). `errorPolicy: "all"` does not
 * throw for either case (a subtlety worth being explicit about — it does
 * not only suppress GraphQL-level errors, unlike what the Apollo docs'
 * phrasing might suggest), so this function checks `data` itself, not
 * just `data.product`, to tell "not found" (a valid application state —
 * the caller should call `notFound()`) apart from "something actually
 * broke" (re-thrown here so it propagates to `error.tsx`, matching
 * `getProductsPage`'s behavior for a real fault). See docs/decisions.md.
 */
export async function getProduct(slug: string): Promise<MusicProduct | null> {
  const { data, error } = await query({
    query: PRODUCT_QUERY,
    variables: { slug },
    errorPolicy: "all",
  });

  if (!data) {
    throw error ?? new Error(`Failed to fetch product "${slug}"`);
  }

  if (!data.product || data.product.__typename !== "SimpleProduct") {
    return null;
  }

  return mapWooCommerceProductToMusicProduct(data.product);
}
