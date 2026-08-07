"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addToCartAction, type CartActionResult } from "@/lib/actions/cart.actions";
import { useCart } from "@/hooks/use-cart";
import type { AddToCartButtonProps } from "./AddToCartButton.types";

/**
 * The Product Detail page's one primary CTA (design-system.md's Button
 * hierarchy: `default` variant, "at most one per view/section"). Adds a
 * fixed quantity of 1 — no quantity picker here for v1; a shopper adjusts
 * quantity from `/cart` after adding, keeping this button and the Detail
 * page's layout unchanged beyond its own presence. Quick-add from
 * `ProductCard`/listing grids is deliberately out of scope for this pass.
 *
 * Wraps a real `<form action={formAction}>` (via `useActionState`) rather
 * than a bare `onClick`, so the mutation still works as a plain form
 * submission without JavaScript — the pending/inline-error UX below is a
 * progressive enhancement on top of that, not the only path that works.
 */
export function AddToCartButton({ productId, className }: AddToCartButtonProps) {
  const { setCart } = useCart();

  const [state, formAction, isPending] = useActionState<CartActionResult | null>(
    async () => {
      const result = await addToCartAction(productId, 1);
      if (result.ok) {
        setCart(result.cart);
      }
      return result;
    },
    null,
  );

  return (
    <form action={formAction} className={className}>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Adding…" : "Add to Cart"}
      </Button>
      {state && !state.ok ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-2 text-sm text-muted-foreground">Added to cart.</p>
      ) : null}
    </form>
  );
}
