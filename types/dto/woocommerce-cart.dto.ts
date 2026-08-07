/**
 * WooCommerce cart DTO — mirrors the WPGraphQL `Cart`/`CartItem` response
 * shape field for field, same DTO -> mapper -> domain pipeline as products
 * (see docs/product-model.md#dto-layer). Verified against the live schema
 * (WPGraphQL for WooCommerce 1.0.3) via introspection — see
 * docs/decisions.md, "Cart".
 *
 * Nothing here should be imported by anything except
 * `services/mappers/cart.mapper.ts`.
 */
export interface WooCommerceCartDto {
  isEmpty: boolean;
  contents: WooCommerceCartItemConnectionDto;
  subtotal: string | null;
  total: string | null;
  totalTax: string | null;
  /** Confirmed live: only `true` once the store has an enabled shipping method the cart's contents actually need — see docs/decisions.md, "Checkout". */
  needsShippingAddress: boolean;
  /** WooCommerce auto-selects a method once exactly one is available for the cart's package — confirmed live, see docs/decisions.md, "Checkout". */
  chosenShippingMethods: (string | null)[] | null;
}

export interface WooCommerceCartItemConnectionDto {
  itemCount: number;
  nodes: WooCommerceCartItemDto[];
}

export interface WooCommerceCartItemDto {
  key: string;
  quantity: number;
  /** Line total before item-level discounts. */
  subtotal: string | null;
  /** Line total after item-level discounts — the amount actually charged for this line. */
  total: string | null;
  product: WooCommerceCartItemProductConnectionEdgeDto | null;
}

export interface WooCommerceCartItemProductConnectionEdgeDto {
  node: WooCommerceCartItemProductDto | null;
}

/**
 * Deliberately narrower than `WooCommerceProductDto` — a cart line only
 * ever needs enough to render a summary row, not a full product. Scoped to
 * `SimpleProduct` for the same reason as the product DTO.
 */
export interface WooCommerceCartItemProductDto {
  databaseId: number;
  slug: string | null;
  name: string | null;
  image: {
    sourceUrl: string | null;
    altText: string | null;
  } | null;
}
