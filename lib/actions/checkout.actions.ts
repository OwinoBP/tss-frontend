"use server";

import { redirect } from "next/navigation";
import * as checkoutService from "@/services/checkout.service";
import * as cartService from "@/services/cart.service";
import { getCartSessionToken, clearCartSessionToken } from "@/lib/cart-session";
import { validateAddress, hasFieldErrors, type AddressFieldErrors } from "@/lib/checkout-validation";
import { routes } from "@/lib/config";
import type { Order, OrderAddress } from "@/types/order";

/**
 * The only code allowed to call `services/checkout.service.ts` — a Client
 * Component never calls a service or Apollo directly (see
 * docs/component-principles.md), same rule `cart.actions.ts` already
 * follows. A rejected submission (validation failure or a WooCommerce
 * error) is returned as a typed `{ ok: false }` result, never thrown — the
 * same "recoverable UI state, not an error" instinct as `cart.actions.ts`.
 *
 * A *successful* checkout never returns a value at all — it calls
 * `redirect()` to `/checkout/success/[orderNumber]` instead. This isn't a
 * style choice: confirmed live (see docs/decisions.md, "Checkout") that
 * `clearCartSessionToken()`'s `cookies().delete()` call makes Next.js
 * automatically re-render `app/checkout/page.tsx` server-side *inside the
 * same action response* — which replaces `CheckoutPageContent`'s whole
 * subtree (the cart is now empty, so `page.tsx` takes its empty-cart
 * branch) before an inline client-state success view would ever get a
 * chance to render. `redirect()` is the framework's own sanctioned escape
 * from that: the confirmation data (`orderNumber`/`total`/`status`/
 * `paymentMethodTitle`) travels via the destination URL, taken from the
 * mutation's response already in hand — no second GraphQL round trip,
 * so the confirmed `order.id` bug and the guest-order re-query
 * authorization check (see docs/decisions.md, "Checkout") stay avoided.
 */
export type CheckoutActionResult = {
  ok: false;
  error: string;
  billingErrors?: AddressFieldErrors;
  shippingErrors?: AddressFieldErrors;
};

function readAddress(formData: FormData, prefix: "billing" | "shipping"): OrderAddress {
  const get = (field: string) => (formData.get(`${prefix}.${field}`) as string | null)?.trim() ?? "";
  return {
    firstName: get("firstName"),
    lastName: get("lastName"),
    company: get("company"),
    address1: get("address1"),
    address2: get("address2"),
    city: get("city"),
    state: get("state"),
    postcode: get("postcode"),
    country: get("country"),
    email: get("email"),
    phone: get("phone"),
  };
}

function checkoutSuccessUrl(order: Order): string {
  const params = new URLSearchParams({
    total: String(order.total.amount),
    currency: order.total.currency,
    status: order.status,
    paymentMethodTitle: order.paymentMethodTitle,
  });
  return `${routes.checkoutSuccessPath(order.orderNumber)}?${params.toString()}`;
}

export async function submitCheckoutAction(
  _previous: CheckoutActionResult | null,
  formData: FormData,
): Promise<CheckoutActionResult> {
  const paymentMethod = (formData.get("paymentMethod") as string | null)?.trim() ?? "";
  const shipToDifferentAddress = formData.get("shipToDifferentAddress") === "on";
  const billing = readAddress(formData, "billing");
  const shipping = shipToDifferentAddress ? readAddress(formData, "shipping") : null;

  const billingErrors = validateAddress(billing, { requireEmail: true });
  const shippingErrors = shipping ? validateAddress(shipping, { requireEmail: false }) : {};

  if (!paymentMethod) {
    return { ok: false, error: "Select a payment method.", billingErrors, shippingErrors };
  }
  if (hasFieldErrors(billingErrors) || hasFieldErrors(shippingErrors)) {
    return {
      ok: false,
      error: "Fix the highlighted fields and try again.",
      billingErrors,
      shippingErrors,
    };
  }

  let order: Order;
  try {
    const sessionToken = await getCartSessionToken();
    const { cart } = await cartService.getCart(sessionToken);
    if (cart.isEmpty) {
      return { ok: false, error: "Your cart is empty." };
    }

    const result = await checkoutService.submitCheckout(
      {
        paymentMethod,
        billing,
        shipping,
        shippingMethod: cart.needsShippingAddress ? cart.chosenShippingMethods : null,
      },
      sessionToken,
    );
    order = result.order;

    // Confirmed live: the guest session `checkout` just consumed is gone,
    // never rotated — see docs/decisions.md, "Checkout". Clearing here
    // means the next `getCart()` starts a fresh guest session instead of
    // sending a token WooCommerce will reject. This is also what triggers
    // the automatic re-render `redirect()` below exists to get ahead of —
    // see this file's top comment.
    await clearCartSessionToken();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Something went wrong placing your order.",
    };
  }

  // Deliberately outside the try/catch above — `redirect()` works by
  // throwing a framework-internal signal, which the generic `catch`
  // would otherwise misreport as a failed checkout.
  redirect(checkoutSuccessUrl(order));
}
