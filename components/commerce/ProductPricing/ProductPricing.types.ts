export type ProductPricingSize = "sm" | "lg";

export interface ProductPricingProps {
  /** Already formatted for display (e.g. "$29.99") — see product-card.mapper.ts / product-info.mapper.ts. No amount/currency math happens here. */
  regularPrice: string;
  /** Formatted the same way as `regularPrice`; present only when the product is on sale. */
  salePrice: string | null;
  /** @default "sm" */
  size?: ProductPricingSize;
  className?: string;
}
