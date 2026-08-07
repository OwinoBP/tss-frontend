"use client";

import { useContext } from "react";
import { CartContext } from "@/components/commerce/CartProvider/CartContext";

/** Throws outside a `CartProvider` — every page renders inside `Shell`, which provides one, so a missing provider is a real wiring bug, not a case to handle gracefully. */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
