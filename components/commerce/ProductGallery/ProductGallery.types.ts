import type { ProductImageSource } from "@/components/commerce/ProductImage";

export interface ProductGalleryProps {
  /** `null` when the product has no primary image — ProductImage renders the placeholder. */
  primary: ProductImageSource | null;
  /** Additional images from `MusicProduct.gallery`. Empty when none exist. */
  secondary: ProductImageSource[];
}
