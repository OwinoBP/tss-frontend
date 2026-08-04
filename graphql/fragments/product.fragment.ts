import { gql } from "@apollo/client";

/**
 * The fields needed to populate a MusicProduct from a WooCommerce product.
 *
 * Scoped to `SimpleProduct` — matches the scoping decision already made in
 * `types/dto/woocommerce-product.dto.ts` (see that file's header comment).
 * Selects exactly the fields `WooCommerceProductDto` expects: nothing more.
 * Fields with no current WooCommerce source (bpm, musicalKey, producer,
 * genres, fileFormat, previewUrl, duration, productType) aren't requested —
 * see docs/api/product-query.md for why each included field is there and
 * why those are intentionally left out.
 *
 * Shared by any query that needs product-card-level data, so the selection
 * set is written once. Interpolate with `${PRODUCT_CARD_FRAGMENT}` and
 * spread `...ProductCardFields` inside a `... on SimpleProduct { }` block —
 * `products.nodes` is typed `[Product!]!` (the shared interface), so this
 * fragment only actually applies to nodes that are really `SimpleProduct`.
 * `__typename` is requested explicitly so the mapper can use it to filter
 * out any other product type rather than relying on Apollo's default
 * `addTypename` behavior implicitly.
 */
export const PRODUCT_CARD_FRAGMENT = gql`
  fragment ProductCardFields on SimpleProduct {
    __typename
    id
    databaseId
    slug
    name
    description
    featured
    date
    regularPrice
    salePrice
    image {
      id
      sourceUrl
      altText
      mediaDetails {
        width
        height
      }
    }
    galleryImages {
      nodes {
        id
        sourceUrl
        altText
        mediaDetails {
          width
          height
        }
      }
    }
    productCategories {
      nodes {
        id
        databaseId
        name
        slug
      }
    }
    productTags {
      nodes {
        id
        databaseId
        name
        slug
      }
    }
  }
`;
