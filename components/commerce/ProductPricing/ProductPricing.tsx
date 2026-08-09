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
 *
 * The regular price is a semantic `<del>` (not a plain `<span>` with only
 * a CSS strikethrough), paired with `sr-only` "Regular price"/"Now" labels
 * on both amounts — a screen reader announces which number is superseded
 * instead of two bare, unexplained amounts. Purely a markup/accessibility
 * correction: no visual or color change (see docs/decisions.md, "Product
 * Detail: breakpoint, gallery semantics, pricing accessibility" — the
 * same investigation confirmed `--primary` isn't safe as bare text here,
 * so the emphasized price stays `text-foreground`, not recolored).
 * Shared with `ProductCard`, so this fix applies there too.
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
          <del className={REGULAR_CLASSES[size]}>
            <span className="sr-only">Regular price: </span>
            {regularPrice}
          </del>
          <span className={EMPHASIZED_CLASSES[size]}>
            <span className="sr-only">Now: </span>
            {salePrice}
          </span>
        </>
      ) : (
        <span className={EMPHASIZED_CLASSES[size]}>{regularPrice}</span>
      )}
    </div>
  );
}
