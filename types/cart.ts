import type { Money, ProductImage } from "@/types/music-product";

/**
 * The canonical Cart model. WooCommerce is the sole source of truth for
 * cart state — this type is what a mapped GraphQL response becomes, never
 * something computed independently on the client. See docs/decisions.md,
 * "Cart" for the full server-authoritative reasoning.
 */
export interface Cart {
  items: CartLineItem[];
  itemCount: number;
  subtotal: Money;
  total: Money;
  totalTax: Money;
  isEmpty: boolean;
  /**
   * Whether the store needs a shipping address to fulfill this cart's
   * contents — reflects real shipping-zone/method configuration, not just
   * "does this cart contain a physical product" (confirmed live: `false`
   * with no shipping method configured for the cart's package, `true` once
   * one exists — see docs/decisions.md, "Checkout"). `app/checkout` gates
   * the shipping address section on this.
   */
  needsShippingAddress: boolean;
  /**
   * WooCommerce's own auto-selected shipping method rate ID(s) for this
   * cart's package — passed straight through to the `checkout` mutation's
   * `shippingMethod` input, not re-chosen by this app (no multi-rate
   * picker yet, see docs/decisions.md, "Checkout").
   */
  chosenShippingMethods: string[];
}

/**
 * A single cart line. `key` — not `product.productId` — is the real
 * identity WooCommerce uses for update/remove mutations: confirmed live
 * that a cart item's key, not the product id, is what `updateItemQuantities`/
 * `removeItemsFromCart` require (see docs/decisions.md, "Cart").
 *
 * `product` is a thin summary, not `MusicProduct` — a cart line has no use
 * for `bpm`/`musicalKey`/`description`/gallery/etc., the same reasoning
 * already established for `ProductCardProps` (see docs/decisions.md,
 * "ProductCard").
 */
export interface CartLineItem {
  key: string;
  product: {
    /** WooCommerce's numeric product ID — needed to re-add this product, not to identify this line (`key` does that). */
    productId: number;
    slug: string;
    title: string;
    artwork: ProductImage | null;
  };
  quantity: number;
  unitPrice: Money;
  lineSubtotal: Money;
}
