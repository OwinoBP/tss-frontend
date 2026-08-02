import Link from "next/link";
import Image from "next/image";
import { Music2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
 * (or a quiet `--muted` placeholder, never a fake image), title/producer/
 * type stacked tight, price set apart with a slightly larger gap, subtle
 * hover-only artwork scale.
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
        <div className="relative aspect-square w-full bg-muted">
          {artwork ? (
            <Image
              src={artwork.url}
              alt={artwork.alt}
              fill
              sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            // No fake artwork: a quiet --muted fill, not a broken-image
            // icon (docs/design-system.md, "Product card anatomy"). The
            // icon is decorative — the card's accessible name already
            // comes from the text content below, so this stays aria-hidden.
            <div className="flex h-full w-full items-center justify-center">
              <Music2
                aria-hidden="true"
                className="size-8 text-muted-foreground/40"
              />
            </div>
          )}
        </div>

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

          <div className="mt-3 flex items-baseline gap-2 font-mono">
            {price.sale ? (
              <>
                <span className="text-sm text-muted-foreground line-through">
                  {price.regular}
                </span>
                <span className="text-base text-foreground">{price.sale}</span>
              </>
            ) : (
              <span className="text-base text-foreground">{price.regular}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
