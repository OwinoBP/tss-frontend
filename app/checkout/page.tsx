import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { getCart } from "@/services/cart.service";
import { getPaymentGateways } from "@/services/checkout.service";
import { getCartSessionToken } from "@/lib/cart-session";
import { routes } from "@/lib/config";
import { CheckoutForm } from "./CheckoutForm";
import { CheckoutOrderSummary } from "./CheckoutOrderSummary";

/**
 * Same reasoning as `/cart` (docs/architecture.md, "Cart"): a page that's
 * neither Listing nor Detail-shaped, `noindex`ed for the same reason every
 * cart/checkout-adjacent page is.
 */
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: true },
};

/**
 * Reads the live cart and available payment gateways directly (a normal
 * Server Component job, same as `/cart`) rather than through a Server
 * Action. An empty cart has nothing to check out — a plain conditional
 * here, the same "empty isn't an error" rule every other page in this app
 * follows, not a redirect or a thrown error.
 *
 * No `CartProvider` here: unlike `/cart`, nothing on this page mutates
 * cart line items — the order summary is a read-only snapshot, so plain
 * props into `CheckoutForm`/`CheckoutOrderSummary` are enough. No client
 * state wrapper either (an earlier pass had one, holding the completed
 * `Order` for an inline success view) — removed once a confirmed
 * Next.js behavior made it unreachable: see
 * `lib/actions/checkout.actions.ts`'s top comment and docs/decisions.md,
 * "Checkout".
 */
export default async function CheckoutPage() {
  const sessionToken = await getCartSessionToken();
  const [{ cart }, paymentGateways] = await Promise.all([
    getCart(sessionToken),
    getPaymentGateways(),
  ]);

  if (cart.isEmpty) {
    return (
      <Section heading="Checkout">
        <div className="flex flex-col items-start gap-4">
          <p className="text-sm text-muted-foreground">
            Your cart is empty — add something before checking out.
          </p>
          <Button asChild variant="outline">
            <Link href={routes.products.index}>Browse products</Link>
          </Button>
        </div>
      </Section>
    );
  }

  return (
    <Section heading="Checkout">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr] lg:items-start">
        <CheckoutForm cart={cart} paymentGateways={paymentGateways} />
        <CheckoutOrderSummary cart={cart} />
      </div>
    </Section>
  );
}
