import { gql, type TypedDocumentNode } from "@apollo/client";
import type { WooCommerceCategoryDto } from "@/types/dto/woocommerce-category.dto";

export interface CategoryQueryData {
  /**
   * `null` when no category matches `slug`. Confirmed live against the real
   * WPGraphQL endpoint (unlike the single-product query): a nonexistent
   * category slug returns a clean `{ productCategory: null }`, with no
   * GraphQL error attached — so, unlike `getProduct`, `getCategory` doesn't
   * need `errorPolicy: "all"` or a `data`-vs-`data.productCategory`
   * distinction to tell "not found" apart from "request failed." See
   * docs/decisions.md, "Category Pages".
   */
  productCategory: WooCommerceCategoryDto | null;
}

export interface CategoryQueryVariables {
  slug: string;
}

/**
 * Single category-by-slug lookup — no existing query/fragment covers a
 * category's own metadata (`description`, `image`, `ancestors`); the only
 * place category data previously appeared was the minimal `{id, databaseId,
 * name, slug}` nested under each product via `ProductFields`, which can't
 * populate a category page's heading/breadcrumbs for a category with zero
 * products. `productCategory(id, idType: SLUG)` was confirmed via live
 * introspection to be the correct root field. See docs/decisions.md.
 */
export const CATEGORY_QUERY: TypedDocumentNode<
  CategoryQueryData,
  CategoryQueryVariables
> = gql`
  query Category($slug: ID!) {
    productCategory(id: $slug, idType: SLUG) {
      id
      databaseId
      name
      slug
      description
      image {
        id
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
      parent {
        node {
          id
          name
          slug
        }
      }
      ancestors {
        nodes {
          id
          name
          slug
        }
      }
    }
  }
`;
