import type { Money, MusicProduct, ProductType } from "@/types/music-product";
import type { ProductCardProps } from "./ProductCard.types";
import { routes, storeConfig } from "@/lib/config";

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

/**
 * Singular display labels for `ProductType` (types/music-product.ts) — a
 * per-item label ("Sample Pack"), not the plural category-browsing label
 * used elsewhere (e.g. "Sample Packs" in components/marketing/ShopByType).
 * Those are different content for different contexts, not the same value
 * duplicated — kept separate rather than sharing one map and pluralizing.
 */
const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  "sample-pack": "Sample Pack",
  "drum-kit": "Drum Kit",
  "midi-pack": "MIDI Pack",
  preset: "Preset",
  "one-shot": "One-Shot",
  "construction-kit": "Construction Kit",
};

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
      regular: formatMoney(product.regularPrice),
      sale: product.salePrice ? formatMoney(product.salePrice) : null,
    },
  };
}

function formatMoney(money: Money): string {
  return new Intl.NumberFormat(storeConfig.locale.default, {
    style: "currency",
    currency: money.currency,
  }).format(money.amount);
}
