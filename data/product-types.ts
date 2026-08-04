import type { ProductType } from "@/types/music-product";

/**
 * Singular display labels for MusicProduct's ProductType union — "Sample
 * Pack", not the plural "Sample Packs" components/marketing/ShopByType
 * uses for its own category-browsing tiles. That's different content for
 * a different context (a single item's label vs. a browse-by-type tile),
 * not this value duplicated — kept separate rather than sharing one map
 * and pluralizing (see docs/decisions.md, the ProductCard ADR).
 *
 * Shared by product-card.mapper.ts and product-info.mapper.ts — the
 * second real consumer that justified moving this out of a single
 * mapper file and into data/, per docs/architecture.md's folder
 * philosophy ("data/ — static content... distinct from lib/config") and
 * docs/component-principles.md ("colocate what's private, extract what's
 * shared").
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  "sample-pack": "Sample Pack",
  "drum-kit": "Drum Kit",
  "midi-pack": "MIDI Pack",
  preset: "Preset",
  "one-shot": "One-Shot",
  "construction-kit": "Construction Kit",
};
