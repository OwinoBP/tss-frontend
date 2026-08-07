import { createCartClient } from "@/lib/apollo/cart-client";
import { CART_QUERY } from "@/graphql/queries/cart.query";
import {
  ADD_TO_CART_MUTATION,
  REMOVE_CART_ITEMS_MUTATION,
  UPDATE_CART_ITEM_QUANTITIES_MUTATION,
} from "@/graphql/mutations/cart.mutations";
import { mapWooCommerceCart } from "@/services/mappers/cart.mapper";
import { storeConfig } from "@/lib/config";
import type { Cart } from "@/types/cart";
import type { WooCommerceCartDto } from "@/types/dto/woocommerce-cart.dto";

/**
 * Cart operations — the fourth resource-scoped service (after site/product/category),
 * and the first that's mutation-driven and session-bound. Deliberately
 * framework-agnostic: functions take/return a plain `sessionToken` string
 * rather than reading `next/headers` cookies themselves, so the cookie
 * read/write stays the calling Server Action's responsibility (see
 * `lib/actions/cart.actions.ts`) and this file stays a plain, testable
 * async-function module like every other service. See docs/decisions.md,
 * "Cart" for why this uses a dedicated Apollo client (`cart-client.ts`)
 * instead of bypassing Apollo with a raw `fetch()`.
 */

export interface CartResult {
  cart: Cart;
  /** The session token to persist for the next call — may be unchanged, rotated, or (on a fresh guest) newly issued. */
  sessionToken: string | null;
}

interface SessionOut {
  token?: string;
}

function resolveSessionToken(previous: string | null, sessionOut: SessionOut): string | null {
  return sessionOut.token ?? previous;
}

function requireCart(dto: WooCommerceCartDto | null | undefined): WooCommerceCartDto {
  if (!dto) {
    throw new Error("WooCommerce did not return a cart for this operation.");
  }
  return dto;
}

export async function getCart(sessionToken: string | null): Promise<CartResult> {
  const client = createCartClient();
  const sessionOut: SessionOut = {};

  const { data } = await client.query<{ cart: WooCommerceCartDto | null }>({
    query: CART_QUERY,
    context: { sessionToken, sessionOut },
    fetchPolicy: "no-cache",
  });

  // No prior session token, WooCommerce not returning one either, means a
  // fresh guest with a genuinely empty cart — not an error case, matching
  // this project's standing "empty is a valid state" rule.
  if (!data?.cart) {
    const zero = { amount: 0, currency: storeConfig.currency.code };
    return {
      cart: { items: [], itemCount: 0, subtotal: zero, total: zero, totalTax: zero, isEmpty: true },
      sessionToken: resolveSessionToken(sessionToken, sessionOut),
    };
  }

  return {
    cart: mapWooCommerceCart(data.cart),
    sessionToken: resolveSessionToken(sessionToken, sessionOut),
  };
}

export async function addToCart(
  productId: number,
  quantity: number,
  sessionToken: string | null,
): Promise<CartResult> {
  const client = createCartClient();
  const sessionOut: SessionOut = {};

  const { data } = await client.mutate<{ addToCart: { cart: WooCommerceCartDto | null } }>({
    mutation: ADD_TO_CART_MUTATION,
    variables: { productId, quantity },
    context: { sessionToken, sessionOut },
    fetchPolicy: "no-cache",
  });

  return {
    cart: mapWooCommerceCart(requireCart(data?.addToCart.cart)),
    sessionToken: resolveSessionToken(sessionToken, sessionOut),
  };
}

export async function updateCartItemQuantity(
  key: string,
  quantity: number,
  sessionToken: string | null,
): Promise<CartResult> {
  const client = createCartClient();
  const sessionOut: SessionOut = {};

  const { data } = await client.mutate<{
    updateItemQuantities: { cart: WooCommerceCartDto | null };
  }>({
    mutation: UPDATE_CART_ITEM_QUANTITIES_MUTATION,
    variables: { key, quantity },
    context: { sessionToken, sessionOut },
    fetchPolicy: "no-cache",
  });

  return {
    cart: mapWooCommerceCart(requireCart(data?.updateItemQuantities.cart)),
    sessionToken: resolveSessionToken(sessionToken, sessionOut),
  };
}

export async function removeCartItem(key: string, sessionToken: string | null): Promise<CartResult> {
  const client = createCartClient();
  const sessionOut: SessionOut = {};

  const { data } = await client.mutate<{
    removeItemsFromCart: { cart: WooCommerceCartDto | null };
  }>({
    mutation: REMOVE_CART_ITEMS_MUTATION,
    variables: { key },
    context: { sessionToken, sessionOut },
    fetchPolicy: "no-cache",
  });

  return {
    cart: mapWooCommerceCart(requireCart(data?.removeItemsFromCart.cart)),
    sessionToken: resolveSessionToken(sessionToken, sessionOut),
  };
}
