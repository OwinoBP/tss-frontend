import type { ProductImage, TaxonomyTerm } from "@/types/music-product";

/**
 * A WooCommerce product category's own metadata — distinct from
 * `TaxonomyTerm` (the minimal `{id, name, slug}` shape attached to a
 * `MusicProduct`). A category page needs more than that to render a
 * heading, description, and breadcrumb trail even when the category has
 * zero products, so it gets its own domain type rather than widening
 * `TaxonomyTerm` for every consumer that only ever needed the minimal
 * shape. See docs/decisions.md, "Category Pages".
 */
export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Empty string, not null, when WooCommerce has no description set (the common case). */
  description: string;
  image: ProductImage | null;
  /** `null` for a top-level category. */
  parent: TaxonomyTerm | null;
  /**
   * Root-first order (Home -> ... -> immediate parent) — confirmed live
   * that WPGraphQL's own `ancestors` connection returns immediate-parent-first,
   * so the mapper reverses it. See docs/decisions.md.
   */
  ancestors: TaxonomyTerm[];
}
