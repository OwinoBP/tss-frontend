import { gql } from "@apollo/client";

/**
 * The fields needed to populate a MusicProduct from a WooCommerce product —
 * every field `WooCommerceProductDto` expects, nothing more. Originally
 * written for the product listing query alone (hence the file's former
 * name, `product-card.fragment.ts`); renamed once `graphql/queries/product.query.ts`
 * (single-product lookup, feature/product-detail) became a second real
 * consumer, since it was never actually scoped to card-display fields —
 * it already selected `description` and `galleryImages`, neither of which
 * `ProductCard` renders, because the fragment's job was always "populate a
 * full `MusicProduct`," not "populate a card." See docs/decisions.md.
 *
 * Scoped to `SimpleProduct` — matches the scoping decision already made in
 * `types/dto/woocommerce-product.dto.ts` (see that file's header comment).
 * Fields with no current WooCommerce source (bpm, musicalKey, producer,
 * genres, fileFormat, previewUrl, duration, productType) aren't requested —
 * see docs/api/product-query.md for why each included field is there and
 * why those are intentionally left out.
 *
 * Shared by any query that needs a full `MusicProduct`'s worth of data, so
 * the selection set is written once. Interpolate with
 * `${PRODUCT_FIELDS_FRAGMENT}` and spread `...ProductFields` inside a
 * `... on SimpleProduct { }` block — both `products` and `product` are
 * typed to return the shared `Product` interface, so this fragment only
 * actually applies to nodes that are really `SimpleProduct`. `__typename`
 * is requested explicitly so callers can use it to filter out any other
 * product type rather than relying on Apollo's default `addTypename`
 * behavior implicitly.
 */
export const PRODUCT_FIELDS_FRAGMENT = gql`
  fragment ProductFields on SimpleProduct {
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
