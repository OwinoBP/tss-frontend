import { gql, type TypedDocumentNode } from "@apollo/client";
import { PRODUCT_FIELDS_FRAGMENT } from "@/graphql/fragments/product.fragment";
import type { WooCommerceProductDto } from "@/types/dto/woocommerce-product.dto";

export interface ProductQueryData {
  /**
   * `null` when no product matches `slug` — confirmed live against the
   * real WPGraphQL endpoint, not assumed: a nonexistent slug returns
   * `data.product: null` *alongside* a top-level GraphQL `errors` entry
   * ("No product ID was found corresponding to the slug: ..."), not a
   * clean null with no errors. `product.service.ts`'s `getProduct` uses
   * `errorPolicy: "all"` specifically because of this — see
   * docs/decisions.md.
   *
   * Typed as `WooCommerceProductDto | null` rather than accounting for
   * "found, but not a SimpleProduct" in the type itself — same tradeoff
   * already made for `ProductsQueryData` (products.query.ts): the type
   * describes the query's shape, not a runtime guarantee: `product.service.ts`
   * checks `__typename` before trusting this as a real
   * `WooCommerceProductDto`.
   */
  product: WooCommerceProductDto | null;
}

export interface ProductQueryVariables {
  slug: string;
}

/**
 * Single-product lookup by slug — reuses `PRODUCT_FIELDS_FRAGMENT`
 * (originally written for `products.query.ts`) rather than a separate
 * detail-specific fragment: it already selects every field
 * `WooCommerceProductDto`/`MusicProduct` needs, so there's no over-fetch
 * to trim and no under-fetch to add. See docs/decisions.md.
 */
export const PRODUCT_QUERY: TypedDocumentNode<
  ProductQueryData,
  ProductQueryVariables
> = gql`
  query Product($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ... on SimpleProduct {
        ...ProductFields
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;
