import type { MusicProduct } from "@/types/music-product";
import type { ProductGalleryProps } from "./ProductGallery.types";

/**
 * MusicProduct -> ProductGalleryProps. Pure — mirrors
 * product-card.mapper.ts's shape one level up the pipeline. First real
 * consumer of `MusicProduct.gallery` (populated by the mapper since the
 * original product-query branch, never rendered anywhere until now).
 */
export function toProductGallery(product: MusicProduct): ProductGalleryProps {
  return {
    primary: product.artwork
      ? {
          url: product.artwork.url,
          alt: product.artwork.alt || `${product.title} artwork`,
        }
      : null,
    secondary: product.gallery.map((image, index) => ({
      url: image.url,
      alt: image.alt || `${product.title} — additional image ${index + 1}`,
    })),
  };
}
