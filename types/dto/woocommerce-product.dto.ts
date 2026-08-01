/**
 * WooCommerce product DTO — mirrors the WPGraphQL response shape, field
 * for field. This is deliberately NOT the domain model: field names,
 * nesting (`{ nodes: [...] }` connections), and nullability here match
 * what the schema actually returns, not what `MusicProduct`
 * (types/music-product.ts) needs. Nothing here should be imported by
 * anything except `services/mappers/product.mapper.ts`.
 * See docs/product-model.md for why this stage exists separately from
 * the domain model.
 *
 * Verified against the live WPGraphQL schema (WPGraphQL 2.18.0,
 * WooCommerce 10.9.4, WPGraphQL for WooCommerce 1.0.3) via introspection.
 * Field names, nullability, and types below are observed facts, not
 * assumptions — see docs/decisions.md for the full schema investigation.
 *
 * Scoped to `SimpleProduct` only. WPGraphQL's `Product` interface is
 * implemented by four concrete types (`SimpleProduct`, `VariableProduct`,
 * `ExternalProduct`, `GroupProduct`); pricing fields (`price`,
 * `regularPrice`, `salePrice`) live on each concrete type, not the shared
 * interface, so a DTO covering all four would need to be a discriminated
 * union. Deferred until there's a real need for it — a digital sample-pack
 * marketplace's individual products are expected to be simple products
 * (no variations, not external, not grouped). Add
 * `WooCommerceVariableProductDto` etc. alongside this one if/when that
 * changes.
 */
export interface WooCommerceProductDto {
  __typename: "SimpleProduct";

  /** Relay global ID. Node-cache identity, not for display. */
  id: string;
  /** Plain WooCommerce/WordPress post ID. */
  databaseId: number;

  slug: string | null;
  /** WooCommerce's product title field is called `name`, not `title`. */
  name: string | null;
  description: string | null;

  featured: boolean | null;
  /** Post publish date. Only a tentative source for `MusicProduct.releaseDate` — see docs/product-model.md. */
  date: string | null;

  /**
   * WooCommerce-formatted price strings (e.g. "19.99"), exactly as
   * WPGraphQL returns them — not parsed into a numeric amount here. That
   * conversion is the mapper's job, not the DTO's.
   */
  regularPrice: string | null;
  salePrice: string | null;

  /** The product's primary image. WooCommerce-specific direct field — simpler than the generic `featuredImage` connection edge, which this DTO doesn't use. */
  image: WooCommerceMediaItemDto | null;
  galleryImages: WooCommerceMediaItemConnectionDto;

  productCategories: WooCommerceProductTermConnectionDto;
  productTags: WooCommerceProductTermConnectionDto;
}

export interface WooCommerceMediaItemDto {
  id: string;
  sourceUrl: string | null;
  altText: string | null;
  mediaDetails: WooCommerceMediaDetailsDto | null;
}

export interface WooCommerceMediaDetailsDto {
  width: number | null;
  height: number | null;
}

export interface WooCommerceMediaItemConnectionDto {
  nodes: WooCommerceMediaItemDto[];
}

/**
 * Shared shape for `ProductCategory` and `ProductTag` nodes. WPGraphQL
 * exposes them as distinct types, but for the fields this DTO selects
 * (id, databaseId, name, slug) their shapes are identical — one DTO type
 * covers both connections below.
 */
export interface WooCommerceProductTermDto {
  id: string;
  databaseId: number;
  name: string | null;
  slug: string | null;
}

export interface WooCommerceProductTermConnectionDto {
  nodes: WooCommerceProductTermDto[];
}
