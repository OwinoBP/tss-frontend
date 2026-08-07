import { createCartClient } from "@/lib/apollo/cart-client";
import { CHECKOUT_MUTATION } from "@/graphql/mutations/checkout.mutations";
import { PAYMENT_GATEWAYS_QUERY } from "@/graphql/queries/checkout.query";
import { mapWooCommerceOrder, mapWooCommercePaymentGateway } from "@/services/mappers/checkout.mapper";
import type { Order, OrderAddress, PaymentGateway } from "@/types/order";
import type {
  WooCommerceCheckoutPayloadDto,
  WooCommercePaymentGatewayDto,
} from "@/types/dto/woocommerce-checkout.dto";

/**
 * Checkout operations — the fifth resource-scoped service, and (like
 * `cart.service.ts`) session-bound and mutation-driven. Reuses
 * `cart-client.ts`/`session-link.ts` rather than a new Apollo client:
 * `checkout` is itself a session-scoped mutation requiring the exact same
 * `woocommerce-session` round trip as every cart mutation — confirmed live,
 * see docs/decisions.md, "Checkout". Deliberately framework-agnostic, same
 * reasoning as `cart.service.ts`: takes/returns a plain `sessionToken`
 * string, never touches `next/headers` itself.
 */

export interface CheckoutSubmission {
  paymentMethod: string;
  billing: OrderAddress;
  /** `null` when the shopper didn't check "ship to a different address" — omitted from the mutation entirely, not sent empty. */
  shipping: OrderAddress | null;
  /**
   * Passed straight through from `Cart.chosenShippingMethods` when
   * `Cart.needsShippingAddress` is true — WooCommerce auto-selects a
   * method once exactly one is available (confirmed live, see
   * docs/decisions.md, "Checkout"); this app doesn't yet offer a
   * multi-rate picker (see "Future Enhancements").
   */
  shippingMethod: string[] | null;
}

export interface CheckoutResult {
  order: Order;
  /**
   * Confirmed live: the `checkout` mutation never returns a
   * `woocommerce-session` response header — the guest session it consumed
   * is gone, not rotated (see docs/decisions.md, "Checkout"). Always
   * `null` today; typed as `string | null` (not dropped) so a future
   * WooGraphQL version that starts rotating a fresh token needs no shape
   * change here, only in `lib/actions/checkout.actions.ts`'s handling of it.
   */
  sessionToken: string | null;
}

export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const client = createCartClient();

  const { data } = await client.query<{
    paymentGateways: { nodes: WooCommercePaymentGatewayDto[] } | null;
  }>({
    query: PAYMENT_GATEWAYS_QUERY,
    fetchPolicy: "no-cache",
  });

  // Confirmed live: with zero enabled gateways, `paymentGateways` resolves
  // to `null` outright (not an empty connection) — see docs/decisions.md,
  // "Checkout". An empty list is this app's normal representation of that.
  return (data?.paymentGateways?.nodes ?? []).map(mapWooCommercePaymentGateway);
}

export async function submitCheckout(
  submission: CheckoutSubmission,
  sessionToken: string | null,
): Promise<CheckoutResult> {
  const client = createCartClient();

  const { data } = await client.mutate<{ checkout: WooCommerceCheckoutPayloadDto }>({
    mutation: CHECKOUT_MUTATION,
    variables: { input: toCheckoutInput(submission) },
    context: { sessionToken },
    fetchPolicy: "no-cache",
  });

  const orderDto = data?.checkout.order;
  if (!orderDto) {
    throw new Error("WooCommerce did not return an order for this checkout.");
  }

  return {
    order: mapWooCommerceOrder(orderDto),
    sessionToken: null,
  };
}

function toCheckoutInput(submission: CheckoutSubmission) {
  return {
    paymentMethod: submission.paymentMethod,
    billing: toAddressInput(submission.billing),
    shipToDifferentAddress: submission.shipping !== null,
    shipping: submission.shipping ? toAddressInput(submission.shipping) : undefined,
    shippingMethod: submission.shippingMethod ?? undefined,
  };
}

function toAddressInput(address: OrderAddress) {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    company: address.company || undefined,
    address1: address.address1,
    address2: address.address2 || undefined,
    city: address.city,
    state: address.state || undefined,
    postcode: address.postcode,
    country: address.country,
    email: address.email || undefined,
    phone: address.phone || undefined,
  };
}
