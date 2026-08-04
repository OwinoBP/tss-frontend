import { ProductPricing } from "@/components/commerce/ProductPricing";
import { ProductMeta } from "@/components/commerce/ProductMeta";
import type { ProductInfoProps } from "./ProductInfo.types";

/**
 * The primary detail-page content column: title, price, description, and
 * (via ProductMeta) producer/type/categories/tags. Server Component, no
 * fetching — receives `ProductInfoProps` only, built by
 * product-info.mapper.ts.
 *
 * Title is a semantic `<h1>` (one per page, per docs/design-system.md's
 * heading hierarchy) but sized like H4 — design-system.md's typography
 * table explicitly assigns H4 to "product title in a detail view," so
 * artwork stays the visual focal point even on the one page most about a
 * single product (artwork-first, restrained chrome).
 *
 * `descriptionHtml` is rendered via `dangerouslySetInnerHTML` — this is
 * trusted WordPress-admin-authored content (WooCommerce's rich-text
 * product description), not user input. See docs/decisions.md for the
 * trust boundary this assumes and why stripping to plain text was
 * rejected (it would discard real admin-authored formatting).
 */
export function ProductInfo({ title, descriptionHtml, price, meta }: ProductInfoProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-[1.25rem] leading-[1.3] font-medium text-foreground">
          {title}
        </h1>
        <ProductPricing
          regularPrice={price.regularPrice}
          salePrice={price.salePrice}
          size="lg"
        />
      </div>

      {descriptionHtml ? (
        <div
          className={
            "text-sm leading-relaxed text-foreground " +
            "[&_p]:mb-4 [&_p:last-child]:mb-0 " +
            "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 " +
            "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 " +
            "[&_li]:mb-1 " +
            "[&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold"
          }
          // Trusted WordPress-admin-authored content — see the component doc comment above.
          dangerouslySetInnerHTML={{ __html: descriptionHtml }}
        />
      ) : null}

      <ProductMeta {...meta} />
    </div>
  );
}
