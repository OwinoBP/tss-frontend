"use client";

import Link from "next/link";
import { CartTable } from "@/components/commerce/CartTable";
import { CartSummary } from "@/components/commerce/CartSummary";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/config";
import { useCart } from "@/hooks/use-cart";

/**
 * Reads the live `Cart` from context (seeded by `page.tsx` with its own
 * server-fetched snapshot, updated after that by `CartTable`'s row
 * mutations via `onCartChange`) — colocated here rather than promoted to
 * `components/commerce/`, since `/cart` is its only consumer today (see
 * docs/component-principles.md, "colocate what's private").
 */
export function CartPageContent() {
  const { cart, setCart } = useCart();

  if (!cart || cart.isEmpty) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
        <Button asChild variant="outline">
          <Link href={routes.products.index}>Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
      <CartTable items={cart.items} onCartChange={setCart} />
      <CartSummary subtotal={cart.subtotal} total={cart.total} totalTax={cart.totalTax} />
    </div>
  );
}
