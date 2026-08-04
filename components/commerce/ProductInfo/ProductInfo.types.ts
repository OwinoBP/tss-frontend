import type { ProductMetaProps } from "@/components/commerce/ProductMeta";

export interface ProductInfoProps {
  title: string;
  /**
   * Trusted, WordPress-admin-authored WooCommerce HTML — not user input.
   * Rendered as-is (see ProductInfo.tsx and docs/decisions.md for the
   * trust boundary this assumes). Empty string renders nothing.
   */
  descriptionHtml: string;
  price: {
    regularPrice: string;
    salePrice: string | null;
  };
  meta: ProductMetaProps;
}
