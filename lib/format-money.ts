import type { Money } from "@/types/music-product";
import { storeConfig } from "@/lib/config";

/**
 * Formats a `Money` value for display in the store's locale (e.g.
 * "$29.99"). Shared by product-card.mapper.ts and product-info.mapper.ts
 * — identical logic in both until this was extracted, not a coincidental
 * resemblance. Pure presentation formatting, not pricing/business logic
 * (no rounding, discount, or currency-conversion rules live here).
 */
export function formatMoney(money: Money): string {
  return new Intl.NumberFormat(storeConfig.locale.default, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount);
}
