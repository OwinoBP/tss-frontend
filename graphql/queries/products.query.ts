import { gql, type TypedDocumentNode } from "@apollo/client";
import { PRODUCT_CARD_FRAGMENT } from "@/graphql/fragments/product-card.fragment";
import type { WooCommerceProductDto } from "@/types/dto/woocommerce-product.dto";

export interface ProductsQueryPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface ProductsQueryData {
  products: {
    /**
     * WPGraphQL types this `[Product!]!` — the shared interface, not
     * `SimpleProduct` directly. A node only actually has the fields this
     * type claims when `__typename === "SimpleProduct"`; for any other
     * concrete type, the `... on SimpleProduct` inline fragment in this
     * query contributes nothing, so the node comes back as little more
     * than `{ __typename }`. `product.service.ts` filters on `__typename`
     * before treating a node as a real `WooCommerceProductDto` — this
     * type describes the query's shape, not a runtime guarantee.
     */
    nodes: WooCommerceProductDto[];
    pageInfo: ProductsQueryPageInfo;
  };
}

/**
 * `first`/`after` are cursor pagination (WPGraphQL's Relay-style
 * connection args). Both optional and unused by the service today —
 * wired through now so pagination doesn't require touching the query
 * shape later, only the service call site.
 */
export interface ProductsQueryVariables {
  first?: number;
  after?: string | null;
}

export const PRODUCTS_QUERY: TypedDocumentNode<
  ProductsQueryData,
  ProductsQueryVariables
> = gql`
  query Products($first: Int, $after: String) {
    products(first: $first, after: $after) {
      nodes {
        ... on SimpleProduct {
          ...ProductCardFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
