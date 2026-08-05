import type { WooCommerceMediaItemDto } from "@/types/dto/woocommerce-product.dto";

/**
 * WooCommerce product category DTO — mirrors WPGraphQL's `ProductCategory`
 * response shape, field for field. Same rationale as
 * `WooCommerceProductDto`: nothing here should be imported by anything
 * except `services/mappers/category.mapper.ts`. See docs/product-model.md.
 *
 * Verified against the live WPGraphQL schema via introspection (temporary
 * nested categories created and removed for the test) — see
 * docs/decisions.md, "Category Pages".
 */
export interface WooCommerceCategoryDto {
  id: string;
  databaseId: number;
  name: string | null;
  slug: string | null;
  description: string | null;
  image: WooCommerceMediaItemDto | null;
  parent: { node: WooCommerceCategoryTermRefDto } | null;
  /**
   * Confirmed live: ordered immediate-parent-first (nearest ancestor at
   * index 0, root last) — the mapper reverses this to root-first for
   * breadcrumb rendering.
   */
  ancestors: { nodes: WooCommerceCategoryTermRefDto[] };
}

/** The minimal shape `parent`/`ancestors` nodes carry — enough for a breadcrumb link, not a full category fetch. */
export interface WooCommerceCategoryTermRefDto {
  id: string;
  name: string | null;
  slug: string | null;
}
