import type { ProductsQueryOrderby } from "@/graphql/queries/products.query";

/**
 * The sort options this storefront offers, keyed by an opaque URL-safe
 * slug (`?sort=price-asc`) rather than WPGraphQL's own `field`/`order`
 * enum values — the URL's public contract shouldn't change if the schema's
 * enum naming ever does; this map is the one place that translation
 * happens. See docs/decisions.md, "Filtering and Sorting".
 *
 * Deliberately limited to fields `ProductCard`/`ProductGrid` actually
 * display (price, name) plus a sensible default (newest) — `PRICE`,
 * `RATING`, and `POPULARITY` are all real, confirmed-live WPGraphQL sort
 * fields (see docs/api/product-query.md), but sorting by a criterion the
 * UI never surfaces (rating, sales count) was deferred rather than
 * shipped speculatively.
 */
export type SortKey = "newest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

export const DEFAULT_SORT_KEY: SortKey = "newest";

export const SORT_OPTIONS: Record<SortKey, { label: string; orderby: ProductsQueryOrderby[] }> = {
  newest: { label: "Newest", orderby: [{ field: "DATE", order: "DESC" }] },
  "price-asc": { label: "Price: Low to High", orderby: [{ field: "PRICE", order: "ASC" }] },
  "price-desc": { label: "Price: High to Low", orderby: [{ field: "PRICE", order: "DESC" }] },
  "name-asc": { label: "Name: A to Z", orderby: [{ field: "NAME", order: "ASC" }] },
  "name-desc": { label: "Name: Z to A", orderby: [{ field: "NAME", order: "DESC" }] },
};

export function isSortKey(value: string): value is SortKey {
  return value in SORT_OPTIONS;
}
