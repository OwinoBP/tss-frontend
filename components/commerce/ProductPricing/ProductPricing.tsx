import { cn } from "@/lib/utils";
import type { ProductPricingProps, ProductPricingSize } from "./ProductPricing.types";

const REGULAR_CLASSES: Record<ProductPricingSize, string> = {
  sm: "text-sm text-muted-foreground line-through",
  lg: "text-base text-muted-foreground line-through",
};

const EMPHASIZED_CLASSES: Record<ProductPricingSize, string> = {
  sm: "text-base text-foreground",
  lg: "text-2xl text-foreground",
};

/**
 * Renders a price: regular only, or regular (de-emphasized, struck
 * through) beside sale (emphasized) when on sale — per
 * docs/design-system.md's "Product card anatomy" pricing row. Strictly
 * presentation: receives already-formatted display strings, does no
 * currency math or formatting of its own (that's each caller's
 * presentation mapper's job — see product-card.mapper.ts,
 * product-info.mapper.ts). `size` is a rendering context the composing
 * component chooses (`ProductCard` uses the "sm" default; `ProductInfo`
 * passes "lg"), not something a mapper decides.
 */
export function ProductPricing({
  regularPrice,
  salePrice,
  size = "sm",
  className,
}: ProductPricingProps) {
  return (
    <div className={cn("flex items-baseline gap-2 font-mono", className)}>
      {salePrice ? (
        <>
          <span className={REGULAR_CLASSES[size]}>{regularPrice}</span>
          <span className={EMPHASIZED_CLASSES[size]}>{salePrice}</span>
        </>
      ) : (
        <span className={EMPHASIZED_CLASSES[size]}>{regularPrice}</span>
      )}
    </div>
  );
}
