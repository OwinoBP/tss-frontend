"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CartContext } from "./CartContext";
import type { Cart } from "@/types/cart";

export interface CartProviderProps {
  children: ReactNode;
  /**
   * Optional starting snapshot — e.g. `app/cart/page.tsx` seeds this with
   * its own server-fetched `Cart` so that page doesn't render blank before
   * any mutation happens. Every update after mount comes only from a
   * Server Action's return value (see `hooks/use-cart.ts`); this prop is
   * the one-time exception for hydrating from an already-server-rendered
   * page, not a second fetch path.
   */
  initialCart?: Cart | null;
}

/**
 * Cart stays server-authoritative (see docs/decisions.md, "Cart") — this
 * provider is a thin, disposable mirror of the last known server response,
 * never a client-computed model. It exists so multiple client islands
 * (today: the `/cart` page's row-level controls; later: a header cart
 * indicator) can reflect the same mutation result without prop-drilling
 * through the Server Components between them.
 */
export function CartProvider({ children, initialCart = null }: CartProviderProps) {
  const [cart, setCart] = useState<Cart | null>(initialCart);
  const value = useMemo(() => ({ cart, setCart }), [cart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
