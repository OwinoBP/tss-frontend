import type {
  MusicProduct,
  Money,
  ProductImage,
  TaxonomyTerm,
  Producer,
  ProductType,
} from "@/types/music-product";
import type {
  WooCommerceProductDto,
  WooCommerceMediaItemDto,
  WooCommerceProductTermDto,
} from "@/types/dto/woocommerce-product.dto";
import { storeConfig } from "@/lib/config";

// Product mapper
//
// Transforms a WooCommerceProductDto (types/dto/woocommerce-product.dto.ts)
// into the canonical MusicProduct (types/music-product.ts). Pure — no
// Apollo, no React, no I/O. Full pipeline and rationale for the DTO stage:
// docs/api/product-query.md and docs/architecture.md.
//
// Two fields have no WooCommerce source yet (`productType`, `producer`) —
// see the constants below and docs/decisions.md for why. Everything else
// maps from real, schema-verified fields.

/**
 * `productType` has no WooCommerce source today — no schema field maps to
 * it (see docs/decisions.md, "Schema investigation" ADR). The recommended
 * long-term source is a WooCommerce Global Product Attribute, not yet
 * configured. Every mapped product gets this same value until that exists;
 * this is a known placeholder, not a real classification.
 */
const UNRESOLVED_PRODUCT_TYPE: ProductType = "sample-pack";

/**
 * `producer` has no WooCommerce source today either. `productBrands` is a
 * real, existing taxonomy that's the likely future source (see
 * docs/decisions.md), but wiring it up is out of scope for this pass.
 */
const UNRESOLVED_PRODUCER: Producer = {
  id: "",
  name: "Unknown Producer",
  slug: "",
  avatarUrl: null,
};

/**
 * No per-product or store-wide currency field exists anywhere in the
 * schema (confirmed by searching every type during schema investigation —
 * the only `currency` field in the entire schema is `Order.currency`).
 * `wcSettings(group: "general")` could theoretically surface the store's
 * currency setting, but that's a generic settings-API passthrough (opaque
 * `id`/`label`/`options` fields, not a typed currency field) and would be a
 * separate, store-wide fetch — not something this per-product mapper
 * should own. Falls back to `storeConfig.currency.code`
 * (`lib/config/store.ts`) until a real per-product/store source exists.
 */
const FALLBACK_CURRENCY = storeConfig.currency.code;

export function mapWooCommerceProductToMusicProduct(
  dto: WooCommerceProductDto,
): MusicProduct {
  return {
    id: dto.id,
    // WordPress practically always sets a slug for a published product;
    // the DTO models it as nullable because the schema does, but falling
    // back to the numeric ID keeps this field meaningfully non-empty
    // rather than silently duplicating an empty string across products.
    slug: dto.slug ?? String(dto.databaseId),
    title: dto.name ?? "Untitled Product",
    description: dto.description ?? "",

    productType: UNRESOLVED_PRODUCT_TYPE,
    categories: dto.productCategories.nodes.map(mapTerm),
    genres: [],
    tags: dto.productTags.nodes.map(mapTerm),

    producer: UNRESOLVED_PRODUCER,

    artwork: dto.image ? mapImage(dto.image) : null,
    gallery: dto.galleryImages.nodes.map(mapImage),

    bpm: null,
    musicalKey: null,
    fileFormat: [],
    duration: null,
    previewUrl: null,

    // A real product should always have a regular price; falling back to
    // zero (rather than throwing) keeps one incomplete product from
    // breaking an entire product list.
    regularPrice: dto.regularPrice
      ? parseMoney(dto.regularPrice)
      : { amount: 0, currency: FALLBACK_CURRENCY },
    salePrice: dto.salePrice ? parseMoney(dto.salePrice) : null,

    featured: dto.featured ?? false,
    releaseDate: parseReleaseDate(dto.date),
  };
}

function mapImage(image: WooCommerceMediaItemDto): ProductImage {
  return {
    url: image.sourceUrl ?? "",
    alt: image.altText ?? "",
    width: image.mediaDetails?.width ?? null,
    height: image.mediaDetails?.height ?? null,
  };
}

function mapTerm(term: WooCommerceProductTermDto): TaxonomyTerm {
  return {
    id: term.id,
    name: term.name ?? "",
    slug: term.slug ?? "",
  };
}

/**
 * WooCommerce/WPGraphQL price fields are documented as pre-formatted
 * display strings (see docs/product-model.md), which may include a
 * currency symbol or other formatting depending on store locale settings.
 * Stripping everything but digits/decimal/minus is a defensive parse, not
 * verified against real data — this store has no products yet to test
 * against. Revisit once real priced products exist.
 */
function parseMoney(raw: string): Money {
  const amount = Number(raw.replace(/[^0-9.-]/g, ""));
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currency: FALLBACK_CURRENCY,
  };
}

/**
 * Normalizes to ISO 8601 defensively rather than passing `dto.date`
 * through as-is — WPGraphQL's exact date format wasn't verified against
 * real data (no products exist yet), and MusicProduct.releaseDate is
 * documented as ISO 8601.
 */
function parseReleaseDate(raw: string | null): string | null {
  if (!raw) {
    return null;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}
