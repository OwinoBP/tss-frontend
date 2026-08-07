import type { Money } from "@/types/music-product";

/**
 * Parses a WooCommerce/WPGraphQL pre-formatted price string (may include a
 * currency symbol or other locale formatting) into a `Money` value.
 * Defensive strip of everything but digits/decimal/minus — the inverse of
 * `format-money.ts`. Extracted here once a third mapper (`checkout.mapper.ts`)
 * needed the exact same logic already duplicated between
 * `product.mapper.ts` and `cart.mapper.ts` — same "extract on the second
 * real duplication" precedent as `formatMoney` (see docs/decisions.md,
 * "Two more real duplications, extracted rather than copy-pasted").
 */
export function parseMoney(raw: string | null | undefined, fallbackCurrency: string): Money {
  const amount = raw ? Number(raw.replace(/[^0-9.-]/g, "")) : 0;
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: fallbackCurrency,
  };
}
