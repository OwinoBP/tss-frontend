"use client";

import { createContext } from "react";
import type { Cart } from "@/types/cart";

export interface CartContextValue {
  /** `null` until the first server snapshot arrives — no independent client-side computation ever populates this (see docs/decisions.md, "Cart"). */
  cart: Cart | null;
  /** Replaces the snapshot wholesale — always called with a `Cart` a Server Action just returned, never a locally-computed patch. */
  setCart: (cart: Cart) => void;
}

export const CartContext = createContext<CartContextValue | null>(null);
