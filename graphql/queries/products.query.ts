import { gql, type TypedDocumentNode } from "@apollo/client";
import { PRODUCT_FIELDS_FRAGMENT } from "@/graphql/fragments/product.fragment";
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
 * The field a sort applies to — confirmed live via `ProductsOrderByEnum`
 * introspection (feature/filtering-and-sorting) to be a real WPGraphQL
 * enum with more values than listed here (`DATE`, `MENU_ORDER`,
 * `MODIFIED`, `NAME`, `PARENT`, `POPULARITY`, `RATING`, `REVIEW_COUNT`,
 * `SLUG` also exist). Narrowed to the subset `data/sort-options.ts`
 * actually offers — sorting by a field the UI never displays (rating,
 * popularity) was deliberately deferred; see docs/decisions.md.
 */
export type ProductsOrderByField = "DATE" | "NAME" | "PRICE";

/** Mirrors WPGraphQL's `ProductsOrderbyInput` (`{ field, order }`), confirmed live. */
export interface ProductsQueryOrderby {
  field: ProductsOrderByField;
  order?: "ASC" | "DESC";
}

/**
 * Mirrors (a subset of) WPGraphQL's own `RootQueryToProductConnectionWhereArgs`
 * — confirmed via live introspection to exist on the `products` root field,
 * not guessed. `search` (feature/product-search) and `category`
 * (feature/category-pages) are wired through today; the type is named
 * after the real GraphQL arg rather than flattened into standalone query
 * variables so a future brand listing page can add `productBrand` here
 * the same additive way, instead of `PRODUCTS_QUERY` growing a new
 * top-level variable per filter.
 *
 * `minPrice`/`maxPrice`/`onSale`/`orderby` (feature/filtering-and-sorting)
 * are the same kind of additive extension — all confirmed live on
 * `RootQueryToProductConnectionWhereArgs`, including `orderby` itself,
 * which lives *inside* `where` in this schema, not as a sibling query
 * variable. No change to `PRODUCTS_QUERY`'s GraphQL document was needed
 * for any of these — `where: $where` was already fully generic. See
 * docs/decisions.md, "Filtering and Sorting".
 */
export interface ProductsQueryWhere {
  search?: string;
  /** A category's slug — confirmed live to filter to products in that single category. */
  category?: string;
  /** Inclusive lower bound, in the store's currency. Confirmed live (`Float`). */
  minPrice?: number;
  /** Inclusive upper bound, in the store's currency. Confirmed live (`Float`). */
  maxPrice?: number;
  /** Restrict to products currently on sale. Confirmed live (`Boolean`). */
  onSale?: boolean;
  orderby?: ProductsQueryOrderby[];
}

/**
 * `first`/`after` are cursor pagination (WPGraphQL's Relay-style
 * connection args). `where` is optional and `undefined` for every caller
 * that doesn't filter (e.g. the plain product catalog) — WPGraphQL treats
 * an omitted `where` identically to no filtering at all, confirmed live.
 */
export interface ProductsQueryVariables {
  first?: number;
  after?: string | null;
  where?: ProductsQueryWhere;
}

export const PRODUCTS_QUERY: TypedDocumentNode<
  ProductsQueryData,
  ProductsQueryVariables
> = gql`
  query Products($first: Int, $after: String, $where: RootQueryToProductConnectionWhereArgs) {
    products(first: $first, after: $after, where: $where) {
      nodes {
        ... on SimpleProduct {
          ...ProductFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${PRODUCT_FIELDS_FRAGMENT}
`;
