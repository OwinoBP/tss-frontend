import type { MusicProduct } from "@/types/music-product";
import type { ProductInfoProps } from "./ProductInfo.types";
import { routes } from "@/lib/config";
import { formatMoney } from "@/lib/format-money";
import { PRODUCT_TYPE_LABELS } from "@/data/product-types";

/**
 * MusicProduct -> ProductInfoProps. Pure — mirrors product-card.mapper.ts's
 * shape. Produces `meta` (ProductMetaProps) as part of the same transform
 * rather than a separate `toProductMeta`: ProductMeta is a distinct,
 * separately-defined component for clarity, but it's fed by this one
 * mapper rather than needing its own — there's exactly one page composing
 * both, and per docs/component-principles.md ("components never fetch
 * their own data"), ProductInfo can't call a second mapper itself; the
 * page would just be threading a second call through unchanged.
 */
export function toProductInfo(product: MusicProduct): ProductInfoProps {
  return {
    title: product.title,
    descriptionHtml: product.description,
    price: {
      regularPrice: formatMoney(product.regularPrice),
      salePrice: product.salePrice ? formatMoney(product.salePrice) : null,
    },
    meta: {
      producer: {
        name: product.producer.name,
        // `producer.slug` is currently always "" (placeholder — see
        // docs/decisions.md), which would build a broken `/producers/`
        // link. Only link once there's a real slug to point at.
        href: product.producer.slug
          ? routes.producers.detailPath(product.producer.slug)
          : null,
      },
      productType: PRODUCT_TYPE_LABELS[product.productType],
      categories: product.categories.map((category) => ({
        name: category.name,
        href: routes.categories.detailPath(category.slug),
      })),
      // Plain strings, not linked — no routes.tags exists (see ProductMeta.types.ts).
      tags: product.tags.map((tag) => tag.name),
    },
  };
}
