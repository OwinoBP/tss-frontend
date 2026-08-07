import { gql } from "@apollo/client";

/**
 * Selection set shared by the cart query and every cart mutation below —
 * written once so a read and a write always return an identically-shaped
 * `Cart`, matching `PRODUCT_FIELDS_FRAGMENT`'s precedent of one fragment
 * shared across every consumer that needs a full domain object back.
 */
export const CART_FIELDS_FRAGMENT = gql`
  fragment CartFields on Cart {
    isEmpty
    subtotal
    total
    totalTax
    needsShippingAddress
    chosenShippingMethods
    contents {
      itemCount
      nodes {
        key
        quantity
        subtotal
        total
        product {
          node {
            ... on SimpleProduct {
              databaseId
              slug
              name
              image {
                sourceUrl
                altText
              }
            }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = gql`
  ${CART_FIELDS_FRAGMENT}
  query Cart {
    cart {
      ...CartFields
    }
  }
`;
