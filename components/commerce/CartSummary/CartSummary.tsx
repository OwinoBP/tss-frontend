import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { routes } from "@/lib/config";
import type { CartSummaryProps } from "./CartSummary.types";

/**
 * Subtotal/tax/total plus a "Proceed to Checkout" link to `routes.checkout`
 * — a stub link to a page that doesn't exist yet, same precedent as
 * `Hero`'s CTAs linking ahead of the pages that serve them. Purely
 * presentational, no fetching or mutation — stays a Server Component.
 */
export function CartSummary({ subtotal, total, totalTax }: CartSummaryProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-6">
      <h2 className="text-lg font-medium text-foreground">Summary</h2>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="font-mono text-foreground">{formatMoney(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Tax</dt>
          <dd className="font-mono text-foreground">{formatMoney(totalTax)}</dd>
        </div>
      </dl>

      <div className="flex justify-between border-t border-border pt-4 text-base font-medium">
        <span>Total</span>
        <span className="font-mono">{formatMoney(total)}</span>
      </div>

      <Button asChild size="lg">
        <Link href={routes.checkout}>Proceed to Checkout</Link>
      </Button>
    </div>
  );
}
