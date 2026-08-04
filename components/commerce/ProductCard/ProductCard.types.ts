/**
 * ProductCard's presentation model — exactly the fields the component
 * renders, nothing else. See product-card.mapper.ts for the
 * `MusicProduct -> ProductCardProps` transform and
 * docs/component-principles.md ("Components consume canonical domain
 * models only") for why ProductCard never receives a `MusicProduct`
 * directly.
 */

import type { ProductImageSource } from "@/components/commerce/ProductImage";

export interface ProductCardProps {
  /** Product detail route — built from `routes.products.detailPath`, never hardcoded. */
  href: string;
  title: string;
  /** `producer.name` — see docs/product-model.md on why `producer` may be revisited, unrelated to this component. */
  producer: string;
  /** Display label for `MusicProduct.productType` (e.g. "Sample Pack"), not the raw slug. */
  productType: string;
  /** `null` when the product has no image — ProductCard renders a placeholder fill, never a fake image (see ProductImage). */
  artwork: ProductImageSource | null;
  /** Already formatted for display — see ProductPricing, which renders this. */
  price: {
    regularPrice: string;
    salePrice: string | null;
  };
}
