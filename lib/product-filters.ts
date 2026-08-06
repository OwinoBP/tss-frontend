import { DEFAULT_SORT_KEY, SORT_OPTIONS, isSortKey, type SortKey } from "@/data/sort-options";
import type { ProductsQueryWhere } from "@/graphql/queries/products.query";

/** The raw query-string shape every listing page (`app/products`, `app/search`, `app/categories/[slug]`) reads for filters/sort. */
export interface ProductFilterParams {
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  onSale?: string;
}

export interface ProductFilterState {
  sortKey: SortKey;
  minPrice: string;
  maxPrice: string;
  onSale: boolean;
}

/**
 * Parses a listing page's raw `searchParams` into a typed filter state —
 * shared by all three listing pages so "?sort=&minPrice=&maxPrice=&onSale="
 * is read identically everywhere, rather than three near-duplicate parsing
 * blocks. An unrecognized/missing `sort` falls back to `DEFAULT_SORT_KEY`
 * rather than being passed through — a stale or tampered `sort` value
 * should degrade to the default ordering, not an error.
 */
export function parseProductFilterParams(params: ProductFilterParams): ProductFilterState {
  return {
    sortKey: params.sort && isSortKey(params.sort) ? params.sort : DEFAULT_SORT_KEY,
    minPrice: params.minPrice ?? "",
    maxPrice: params.maxPrice ?? "",
    onSale: params.onSale === "1",
  };
}

/**
 * Translates a parsed filter state into the `ProductsQueryWhere` fields
 * `getProductsPage` passes straight through to WPGraphQL. `orderby` is
 * always present (resolving to `DEFAULT_SORT_KEY`'s ordering when no sort
 * is active) — an explicit default rather than leaving ordering to
 * WPGraphQL's own unstated one. `minPrice`/`maxPrice` are only included
 * when they parse to a finite number, so a malformed value (e.g. a
 * tampered URL) is silently dropped rather than sent as `NaN`.
 */
export function productFilterStateToWhere(
  state: ProductFilterState,
): Pick<ProductsQueryWhere, "minPrice" | "maxPrice" | "onSale" | "orderby"> {
  const minPrice = Number(state.minPrice);
  const maxPrice = Number(state.maxPrice);

  return {
    orderby: SORT_OPTIONS[state.sortKey].orderby,
    ...(state.minPrice !== "" && Number.isFinite(minPrice) ? { minPrice } : {}),
    ...(state.maxPrice !== "" && Number.isFinite(maxPrice) ? { maxPrice } : {}),
    ...(state.onSale ? { onSale: true } : {}),
  };
}

/**
 * True when the filter state differs from the page's unfiltered default —
 * the signal every listing page's `generateMetadata` uses to `noindex` a
 * filtered/sorted result the same way it already `noindex`es `?after=`
 * pages: neither has a stable per-combination URL worth indexing
 * separately. See docs/decisions.md, "Filtering and Sorting".
 */
export function hasActiveProductFilters(state: ProductFilterState): boolean {
  return (
    state.sortKey !== DEFAULT_SORT_KEY ||
    state.minPrice !== "" ||
    state.maxPrice !== "" ||
    state.onSale
  );
}

/**
 * Builds a query string that preserves the current filter/sort state for
 * a "Next" pagination link. Every listing page's `Next` link previously
 * only ever appended `after` to a bare path — harmless before filtering
 * existed, but it would have silently dropped any active filter once it
 * did. `extra` carries page-specific params not covered by filter state
 * itself (`q` for `app/search`, `after` for the page being linked to).
 */
export function buildListingQueryString(
  state: ProductFilterState,
  extra: Record<string, string | undefined> = {},
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  if (state.sortKey !== DEFAULT_SORT_KEY) params.set("sort", state.sortKey);
  if (state.minPrice !== "") params.set("minPrice", state.minPrice);
  if (state.maxPrice !== "") params.set("maxPrice", state.maxPrice);
  if (state.onSale) params.set("onSale", "1");

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}
