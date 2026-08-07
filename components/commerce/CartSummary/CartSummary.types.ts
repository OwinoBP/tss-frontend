import type { Money } from "@/types/music-product";

export interface CartSummaryProps {
  subtotal: Money;
  total: Money;
  totalTax: Money;
}
