"use server";

import * as cartService from "@/services/cart.service";
import { getCartSessionToken, setCartSessionToken } from "@/lib/cart-session";
import type { Cart } from "@/types/cart";

/**
 * The only code allowed to call `services/cart.service.ts`'s mutating
 * functions — a Client Component never calls a service or Apollo directly
 * (see docs/component-principles.md); it calls one of these instead. Each
 * action reads the current session cookie, runs the mutation, writes back
 * whatever token WooCommerce returned, and hands the fresh `Cart` straight
 * back to the caller — that return value, not `revalidatePath`, is what
 * keeps `CartProvider`'s context in sync (see docs/decisions.md, "Cart").
 *
 * Failures are returned as a typed `{ ok: false }` result, never thrown —
 * a rejected mutation (e.g. insufficient stock) is a normal, recoverable
 * UI state for the calling component to display inline, the same "empty/
 * rejected isn't an error" instinct this project already applies to zero-
 * result listings.
 */
export type CartActionResult = { ok: true; cart: Cart } | { ok: false; error: string };

async function runCartAction(
  operation: (sessionToken: string | null) => Promise<cartService.CartResult>,
): Promise<CartActionResult> {
  try {
    const sessionToken = await getCartSessionToken();
    const result = await operation(sessionToken);
    if (result.sessionToken) {
      await setCartSessionToken(result.sessionToken);
    }
    return { ok: true, cart: result.cart };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong updating your cart.",
    };
  }
}

export async function addToCartAction(productId: number, quantity: number): Promise<CartActionResult> {
  return runCartAction((sessionToken) => cartService.addToCart(productId, quantity, sessionToken));
}

export async function updateCartItemQuantityAction(
  key: string,
  quantity: number,
): Promise<CartActionResult> {
  return runCartAction((sessionToken) => cartService.updateCartItemQuantity(key, quantity, sessionToken));
}

export async function removeCartItemAction(key: string): Promise<CartActionResult> {
  return runCartAction((sessionToken) => cartService.removeCartItem(key, sessionToken));
}
