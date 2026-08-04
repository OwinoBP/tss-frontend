import type { MusicProduct } from "@/types/music-product";
import type { ProductCardProps } from "./ProductCard.types";
import { routes } from "@/lib/config";
import { formatMoney } from "@/lib/format-money";
import { PRODUCT_TYPE_LABELS } from "@/data/product-types";

// Product card mapper
//
// Transforms the canonical MusicProduct (types/music-product.ts) into
// ProductCardProps — the lightweight presentation model ProductCard
// actually renders. Pure — no I/O, no React, no Apollo — mirroring the
// same DTO -> domain mapper shape already established in
// services/mappers/product.mapper.ts, one stage further down the pipeline:
//
//   MusicProduct -> toProductCard() -> ProductCardProps -> ProductCard
//
// Colocated with the component rather than under services/mappers/: this
// isn't a data-fetching concern (no WooCommerce/GraphQL knowledge here),
// it's presentation shaping for one specific component. See
// docs/component-principles.md, "Colocate what's private."

export function toProductCard(product: MusicProduct): ProductCardProps {
  return {
    href: routes.products.detailPath(product.slug),
    title: product.title,
    producer: product.producer.name,
    productType: PRODUCT_TYPE_LABELS[product.productType],
    artwork: product.artwork
      ? {
          url: product.artwork.url,
          // `product.artwork.alt` is `""` when WooCommerce has no alt text
          // set (see types/music-product.ts) — falling back here keeps the
          // "meaningful alt text" requirement true regardless of source data.
          alt: product.artwork.alt || `${product.title} artwork`,
        }
      : null,
    price: {
      regularPrice: formatMoney(product.regularPrice),
      salePrice: product.salePrice ? formatMoney(product.salePrice) : null,
    },
  };
}
