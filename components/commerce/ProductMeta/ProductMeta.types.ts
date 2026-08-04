export interface ProductMetaCategory {
  name: string;
  href: string;
}

export interface ProductMetaProps {
  /** Linked only when a real slug exists — `producer` is currently always a placeholder with an empty slug (see docs/decisions.md), so this is `null` for every real product today. */
  producer: { name: string; href: string | null };
  /** Display label for `MusicProduct.productType` (e.g. "Sample Pack"). */
  productType: string;
  /** Linked — `routes.categories.detailPath` exists. */
  categories: ProductMetaCategory[];
  /** Plain, not linked — no `routes.tags` exists yet; not inventing one ahead of a real tag-browsing page. */
  tags: string[];
}
