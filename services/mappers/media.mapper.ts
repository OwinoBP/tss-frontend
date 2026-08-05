import type { ProductImage } from "@/types/music-product";
import type { WooCommerceMediaItemDto } from "@/types/dto/woocommerce-product.dto";

/**
 * `WooCommerceMediaItemDto -> ProductImage`, extracted here once a second
 * mapper needed it: `product.mapper.ts` had this as a private function
 * until `category.mapper.ts` needed the identical `MediaItem -> ProductImage`
 * transform for `Category.image` — same "colocate what's private, extract
 * what's shared" rule already applied to `PRODUCT_TYPE_LABELS`/`formatMoney`
 * (see docs/decisions.md, "Product Detail").
 */
export function mapWooCommerceImage(image: WooCommerceMediaItemDto): ProductImage {
  return {
    url: image.sourceUrl ?? "",
    alt: image.altText ?? "",
    width: image.mediaDetails?.width ?? null,
    height: image.mediaDetails?.height ?? null,
  };
}
