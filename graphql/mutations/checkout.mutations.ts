import { gql } from "@apollo/client";

/**
 * `order.id` (the Relay global ID) is deliberately never selected here —
 * confirmed live to throw "Internal server error" resolving it for a guest
 * order on this WooGraphQL version. `databaseId` is requested instead. See
 * docs/decisions.md, "Checkout".
 */
export const CHECKOUT_MUTATION = gql`
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        databaseId
        orderNumber
        status
        total
        subtotal
        shippingTotal
        totalTax
        discountTotal
        paymentMethod
        paymentMethodTitle
        billing {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
        shipping {
          firstName
          lastName
          company
          address1
          address2
          city
          state
          postcode
          country
          email
          phone
        }
      }
    }
  }
`;
