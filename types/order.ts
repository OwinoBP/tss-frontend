import type { Money } from "@/types/music-product";

/**
 * The canonical Order model — what a mapped `checkout` mutation response
 * becomes, the same DTO -> mapper -> domain pipeline as every other
 * WooCommerce resource in this app (see docs/decisions.md, "Checkout" for
 * why Order gets its own domain model rather than being folded into
 * `Cart`: it carries fields — billing/shipping addresses, order number,
 * status, payment method — that a cart has no place for).
 */
export interface Order {
  databaseId: number;
  orderNumber: string;
  status: OrderStatus;
  total: Money;
  subtotal: Money;
  shippingTotal: Money;
  totalTax: Money;
  discountTotal: Money;
  paymentMethod: string;
  paymentMethodTitle: string;
  billing: OrderAddress;
  shipping: OrderAddress | null;
}

/**
 * Mirrors WPGraphQL's `OrderStatusEnum` (confirmed live — see
 * docs/decisions.md, "Checkout"). A guest checkout with an offline payment
 * method (the only kind this store has, see "Checkout") lands on
 * `PROCESSING` or `ON_HOLD`, never the others below — the full enum is
 * still modeled since `Order.status` isn't narrowed by the mutation itself.
 */
export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "FAILED"
  | "CHECKOUT_DRAFT";

/** Shared shape for both `Order.billing` and `Order.shipping`, and for the two `CheckoutForm` field groups that produce them. */
export interface OrderAddress {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  /** ISO 3166-1 alpha-2 — WPGraphQL's `CountriesEnum` (confirmed live, 250 values, see `data/countries.ts`). */
  country: string;
  email: string;
  phone: string;
}

export interface PaymentGateway {
  id: string;
  title: string;
  description: string;
}
