import { gql } from "@apollo/client";
import { CART_FIELDS_FRAGMENT } from "@/graphql/queries/cart.query";

/** `productId` is WooCommerce's numeric `databaseId` — confirmed via introspection, see docs/decisions.md, "Cart". */
export const ADD_TO_CART_MUTATION = gql`
  ${CART_FIELDS_FRAGMENT}
  mutation AddToCart($productId: Int!, $quantity: Int!) {
    addToCart(input: { productId: $productId, quantity: $quantity }) {
      cart {
        ...CartFields
      }
    }
  }
`;

/** `key` is the cart item key (`WooCommerceCartItemDto.key`), not a product id. */
export const UPDATE_CART_ITEM_QUANTITIES_MUTATION = gql`
  ${CART_FIELDS_FRAGMENT}
  mutation UpdateCartItemQuantities($key: ID!, $quantity: Int!) {
    updateItemQuantities(input: { items: [{ key: $key, quantity: $quantity }] }) {
      cart {
        ...CartFields
      }
    }
  }
`;

export const REMOVE_CART_ITEMS_MUTATION = gql`
  ${CART_FIELDS_FRAGMENT}
  mutation RemoveCartItems($key: ID!) {
    removeItemsFromCart(input: { keys: [$key] }) {
      cart {
        ...CartFields
      }
    }
  }
`;
