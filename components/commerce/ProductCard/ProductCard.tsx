import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImage } from "@/components/commerce/ProductImage";
import { ProductPricing } from "@/components/commerce/ProductPricing";
import type { ProductCardProps } from "./ProductCard.types";

/**
 * The canonical product presentation — reused everywhere a product is
 * shown as a preview (grids, carousels, related-product rails). Receives
 * only `ProductCardProps`, never `MusicProduct` directly; see
 * product-card.mapper.ts for that transform and
 * docs/component-principles.md for why. Server Component: no state, no
 * `"use client"`, no fetching — the whole card is a single `next/link`.
 *
 * Matches docs/design-system.md's "Product card anatomy": 1:1 artwork
 * (via ProductImage — placeholder handling lives there, not here), title/
 * producer/type stacked tight, price (via ProductPricing) set apart with
 * a slightly larger gap, subtle hover-only artwork scale.
 */
export function ProductCard({
  href,
  title,
  producer,
  productType,
  artwork,
  price,
}: ProductCardProps) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="gap-4 overflow-hidden py-0">
        <ProductImage
          artwork={artwork}
          sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
          className="transition-transform duration-200 ease-out group-hover:scale-[1.03]"
        />

        <CardContent className="flex flex-col pb-4">
          <div className="flex flex-col gap-1">
            <h3 className="line-clamp-2 text-[1.25rem] leading-[1.3] font-medium text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">{producer}</p>
            <p className="text-xs font-medium text-muted-foreground">
              {productType}
            </p>
          </div>

          <ProductPricing
            regularPrice={price.regularPrice}
            salePrice={price.salePrice}
            className="mt-3"
          />
        </CardContent>
      </Card>
    </Link>
  );
}
