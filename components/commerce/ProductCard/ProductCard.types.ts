/**
 * ProductCard's presentation model — exactly the fields the component
 * renders, nothing else. See product-card.mapper.ts for the
 * `MusicProduct -> ProductCardProps` transform and
 * docs/component-principles.md ("Components consume canonical domain
 * models only") for why ProductCard never receives a `MusicProduct`
 * directly.
 */

export interface ProductCardArtwork {
  url: string;
  /**
   * Always meaningful, never empty — product-card.mapper.ts guarantees a
   * fallback even when the source `MusicProduct.artwork.alt` is `""`.
   */
  alt: string;
}

export interface ProductCardPrice {
  /** Formatted for display in the store's locale/currency (e.g. "$29.99"). */
  regular: string;
  /** Formatted the same way as `regular`; present only when on sale. */
  sale: string | null;
}

export interface ProductCardProps {
  /** Product detail route — built from `routes.products.detailPath`, never hardcoded. */
  href: string;
  title: string;
  /** `producer.name` — see docs/product-model.md on why `producer` may be revisited, unrelated to this component. */
  producer: string;
  /** Display label for `MusicProduct.productType` (e.g. "Sample Pack"), not the raw slug. */
  productType: string;
  /** `null` when the product has no image — ProductCard renders a placeholder fill, never a fake image. */
  artwork: ProductCardArtwork | null;
  price: ProductCardPrice;
}
