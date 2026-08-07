/**
 * WooCommerce checkout DTOs — mirror the WPGraphQL `checkout` mutation's
 * response shape field for field, same DTO -> mapper -> domain pipeline as
 * products/cart (see docs/product-model.md#dto-layer). Verified against the
 * live schema (WPGraphQL for WooCommerce 1.0.3) via introspection and a
 * real guest checkout run against a temporary product/order — see
 * docs/decisions.md, "Checkout".
 *
 * `order.id` (the Relay global ID) is deliberately never requested — a
 * confirmed, reproducible WPGraphQL/WooGraphQL bug throws "Internal server
 * error" resolving it for a guest order (`customer_id` 0). `databaseId` is
 * used instead, the same `id`-is-opaque/`databaseId`-for-mutations
 * precedent `MusicProduct.databaseId` already established. See
 * docs/decisions.md, "Checkout".
 *
 * Nothing here should be imported by anything except
 * `services/mappers/checkout.mapper.ts`.
 */
export interface WooCommerceCheckoutPayloadDto {
  result: string | null;
  redirect: string | null;
  order: WooCommerceOrderDto | null;
}

export interface WooCommerceOrderDto {
  databaseId: number;
  orderNumber: string | null;
  status: string | null;
  total: string | null;
  subtotal: string | null;
  shippingTotal: string | null;
  totalTax: string | null;
  discountTotal: string | null;
  paymentMethod: string | null;
  paymentMethodTitle: string | null;
  billing: WooCommerceOrderAddressDto | null;
  shipping: WooCommerceOrderAddressDto | null;
}

/** Shared by `Order.billing` and `Order.shipping` — same field set WPGraphQL's `CustomerAddress` output type exposes. */
export interface WooCommerceOrderAddressDto {
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
}

export interface WooCommercePaymentGatewayDto {
  id: string;
  title: string | null;
  description: string | null;
}
