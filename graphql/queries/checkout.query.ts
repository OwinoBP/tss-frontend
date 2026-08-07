import { gql } from "@apollo/client";

/**
 * Confirmed live (see docs/decisions.md, "Checkout") that no payment
 * method is hardcoded in this app — `checkout.actions.ts` rejects a
 * `paymentMethod` that isn't one of these `id`s, and WooCommerce itself
 * returns "Invalid payment method." for anything else. This store
 * currently has zero *enabled* gateways (all three installed offline
 * gateways — bacs/cheque/cod — start disabled); see "Checkout" for why
 * that's a real operational gap flagged for the store admin, not something
 * this query can paper over.
 */
export const PAYMENT_GATEWAYS_QUERY = gql`
  query PaymentGateways {
    paymentGateways {
      nodes {
        id
        title
        description
      }
    }
  }
`;
