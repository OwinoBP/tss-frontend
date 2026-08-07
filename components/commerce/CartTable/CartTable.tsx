"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ProductImage } from "@/components/commerce/ProductImage";
import { Button } from "@/components/ui/button";
import { removeCartItemAction, updateCartItemQuantityAction } from "@/lib/actions/cart.actions";
import { formatMoney } from "@/lib/format-money";
import { routes } from "@/lib/config";
import type { CartLineItem } from "@/types/cart";
import type { CartTableProps } from "./CartTable.types";

/**
 * The `/cart` page's line-item list. Receives `items`/`onCartChange` as
 * plain props (not `useCart()` directly) so it stays isolable/testable per
 * docs/component-principles.md — the page wires `onCartChange` to its own
 * `useCart().setCart`. `"use client"` at the top of this file covers every
 * row below it; nothing here needs its own directive.
 */
export function CartTable({ items, onCartChange }: CartTableProps) {
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <CartTableRow key={item.key} item={item} onCartChange={onCartChange} />
      ))}
    </ul>
  );
}

function CartTableRow({
  item,
  onCartChange,
}: {
  item: CartLineItem;
  onCartChange: CartTableProps["onCartChange"];
}) {
  const [isPending, startTransition] = useTransition();

  function handleQuantityChange(nextQuantity: number) {
    if (nextQuantity < 1) {
      return;
    }
    startTransition(async () => {
      const result = await updateCartItemQuantityAction(item.key, nextQuantity);
      if (result.ok) {
        onCartChange(result.cart);
      }
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeCartItemAction(item.key);
      if (result.ok) {
        onCartChange(result.cart);
      }
    });
  }

  return (
    <li className="flex gap-4 border-b border-border pb-6 last:border-b-0 last:pb-0" aria-busy={isPending}>
      <ProductImage
        artwork={item.product.artwork}
        sizes="96px"
        className="w-24 shrink-0 rounded-lg"
      />

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <Link
            href={routes.products.detailPath(item.product.slug)}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {item.product.title}
          </Link>
          <p className="font-mono text-sm text-foreground">{formatMoney(item.lineSubtotal)}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" role="group" aria-label={`Quantity for ${item.product.title}`}>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isPending || item.quantity <= 1}
              onClick={() => handleQuantityChange(item.quantity - 1)}
              aria-label="Decrease quantity"
            >
              −
            </Button>
            <span className="w-8 text-center font-mono text-sm" aria-live="polite">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={isPending}
              onClick={() => handleQuantityChange(item.quantity + 1)}
              aria-label="Increase quantity"
            >
              +
            </Button>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={handleRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </li>
  );
}
