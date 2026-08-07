import { ProductImage } from "@/components/commerce/ProductImage";
import { formatMoney } from "@/lib/format-money";
import type { Cart } from "@/types/cart";

/**
 * A read-only mirror of `/cart`'s line items/totals — deliberately not
 * `CartTable`/`CartSummary` (both are quantity-editable and carry a
 * "Proceed to Checkout" CTA that makes no sense on the page it'd link to).
 * Colocated, single consumer — same reasoning as every other file in this
 * folder.
 */
export function CheckoutOrderSummary({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border p-6">
      <h2 className="text-lg font-medium text-foreground">Order Summary</h2>

      <ul className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <li key={item.key} className="flex gap-3">
            <ProductImage artwork={item.product.artwork} sizes="64px" className="w-16 shrink-0 rounded-lg" />
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{item.product.title}</p>
                <p className="font-mono text-sm text-foreground">{formatMoney(item.lineSubtotal)}</p>
              </div>
              <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-mono text-foreground">{formatMoney(cart.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="font-mono text-foreground">{formatMoney(cart.totalTax)}</dd>
        </div>
      </dl>

      <div className="flex justify-between border-t border-border pt-4 text-base font-medium">
        <span>Total</span>
        <span className="font-mono">{formatMoney(cart.total)}</span>
      </div>
    </div>
  );
}
