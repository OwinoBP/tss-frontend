import type { Metadata } from "next";
import { Section } from "@/components/layout/Section";
import { CartProvider } from "@/components/commerce/CartProvider";
import { getCart } from "@/services/cart.service";
import { getCartSessionToken } from "@/lib/cart-session";
import { CartPageContent } from "./CartPageContent";

/**
 * A cart has no "not found" state (it always exists, even empty) and no
 * pagination — it's neither the Listing nor the Detail pattern documented
 * in docs/architecture.md, so it doesn't force-fit either. "Empty" is a
 * plain conditional in `CartPageContent`, the same "empty isn't an error"
 * rule the rest of the app already follows.
 */
export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: true },
};

/**
 * Reads the cart directly (a normal Server Component job, same as every
 * other page's initial fetch) rather than through a Server Action — Server
 * Actions exist for mutations, not reads. Seeds `CartProvider` with this
 * snapshot so `CartPageContent`'s row-level mutations have something to
 * update; every change after this initial render comes from a Server
 * Action's return value, never a second fetch. See docs/decisions.md,
 * "Cart".
 *
 * No try/catch: a thrown fetch error propagates to error.tsx, matching
 * every other page in this app.
 */
export default async function CartPage() {
  const sessionToken = await getCartSessionToken();
  const { cart } = await getCart(sessionToken);

  return (
    <Section heading="Cart">
      <CartProvider initialCart={cart}>
        <CartPageContent />
      </CartProvider>
    </Section>
  );
}
