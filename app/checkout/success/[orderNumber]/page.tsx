import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format-money";
import { routes } from "@/lib/config";

/**
 * Reached only via `lib/actions/checkout.actions.ts`'s `redirect()` after a
 * successful order — confirmation data (`total`/`currency`/`status`/
 * `paymentMethodTitle`) travels as query params from that action's already-
 * mapped `Order`, not re-fetched here. Deliberately not a live re-query:
 * that would hit both a confirmed WooGraphQL bug on `order.id` and a guest-
 * order authorization check an unauthenticated re-query can't satisfy — see
 * docs/decisions.md, "Checkout" for the full reasoning and the framework
 * behavior (`redirect()` after a cookie-mutating action) that made a
 * dedicated route the right call instead of an inline client success view.
 *
 * Same `noindex` reasoning as every cart/checkout-adjacent page — this URL
 * is single-use and shouldn't be indexed or treated as a stable order
 * history/receipt page (see Scope: "order history"/"invoices" excluded
 * from this pass).
 */
export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: true },
};

interface CheckoutSuccessPageProps {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ total?: string; currency?: string; status?: string; paymentMethodTitle?: string }>;
}

export default async function CheckoutSuccessPage({ params, searchParams }: CheckoutSuccessPageProps) {
  const { orderNumber } = await params;
  const search = await searchParams;

  const total = {
    amount: search.total ? Number(search.total) : 0,
    currency: search.currency ?? "USD",
  };
  const status = search.status ?? "";
  const paymentMethodTitle = search.paymentMethodTitle ?? "";

  return (
    <Section heading="Order confirmed">
      <div className="flex flex-col items-start gap-6 rounded-xl border border-border p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-medium text-foreground">Thank you — your order is in.</h2>
          <p className="text-sm text-muted-foreground">
            A confirmation has been recorded under order #{orderNumber}.
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Order number</dt>
          <dd className="font-mono text-foreground">{orderNumber}</dd>

          {status ? (
            <>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground">{formatOrderStatus(status)}</dd>
            </>
          ) : null}

          {paymentMethodTitle ? (
            <>
              <dt className="text-muted-foreground">Payment method</dt>
              <dd className="text-foreground">{paymentMethodTitle}</dd>
            </>
          ) : null}

          <dt className="text-muted-foreground">Total</dt>
          <dd className="font-mono text-foreground">{formatMoney(total)}</dd>
        </dl>

        <Button asChild>
          <Link href={routes.products.index}>Continue shopping</Link>
        </Button>
      </div>
    </Section>
  );
}

function formatOrderStatus(status: string): string {
  const words = status.toLowerCase().split("_");
  return words.map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join(" ");
}
