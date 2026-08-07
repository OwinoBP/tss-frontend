export interface AddToCartButtonProps {
  /** WooCommerce's numeric product ID (`MusicProduct.databaseId`) — `addToCart`'s required input, confirmed via introspection (see docs/decisions.md, "Cart"). */
  productId: number;
  className?: string;
}
