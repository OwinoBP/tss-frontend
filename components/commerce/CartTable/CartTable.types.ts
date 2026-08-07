import type { Cart, CartLineItem } from "@/types/cart";

export interface CartTableProps {
  items: CartLineItem[];
  /** Called with the fresh `Cart` a row's own Server Action returns — the only way this component's mutations reach the page's Context (see components/commerce/CartProvider). */
  onCartChange: (cart: Cart) => void;
}
