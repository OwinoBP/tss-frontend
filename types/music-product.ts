/**
 * The canonical music product model.
 *
 * This describes the business domain — a thing sold on a music sample
 * marketplace — not WooCommerce's or WPGraphQL's schema. Nothing outside
 * `services/mappers/` should need to know how a `MusicProduct` was sourced.
 * See docs/product-model.md for the reasoning and field-by-field origin.
 */
export interface MusicProduct {
  /** Stable unique identifier. Opaque — treat as an ID, not a parseable value. */
  id: string;
  /** URL-safe identifier used for routing (e.g. `/products/{slug}`). */
  slug: string;

  title: string;
  description: string;

  /** What kind of product this is — determines which of the fields below are meaningful. */
  productType: ProductType;
  /**
   * Store categories, for navigation (e.g. "Drum Kits"). An array because
   * WooCommerce products can belong to more than one category — the
   * canonical model shouldn't be more restrictive than the backend it's
   * sourced from.
   */
  categories: TaxonomyTerm[];
  /** Musical genre(s) this product fits (e.g. "Trap", "Lo-Fi"). A product can span more than one. */
  genres: TaxonomyTerm[];
  /** Free-form descriptive tags (mood, instrumentation, era, etc.) for search and filtering. */
  tags: TaxonomyTerm[];

  producer: Producer;

  /**
   * `null` when the product has no image set. Discovered wiring up the
   * real WooCommerce data: unlike most other required fields, "no product
   * photo" is a normal, permanent state for a real product — not a
   * temporary backend gap — so this is nullable rather than defaulting to
   * a placeholder image. See docs/api/product-query.md.
   */
  artwork: ProductImage | null;
  /** Additional preview images (waveform screenshots, plugin UI, packaging, etc.). */
  gallery: ProductImage[];

  /** Tempo in beats per minute. `null` when not applicable or not set (e.g. some Presets). */
  bpm: number | null;
  /** Musical key, e.g. "C# Minor". `null` when not applicable or not set. */
  musicalKey: string | null;
  /**
   * File formats included in the download (e.g. "WAV", "MIDI", "Serum Preset").
   * Kept as free-form strings rather than a closed enum — the set of formats
   * spans audio, MIDI, and DAW/plugin-specific files and isn't finalized.
   */
  fileFormat: string[];
  /** Preview audio length, in seconds. `null` when there's no preview. */
  duration: number | null;
  /** Streamable audio preview URL. `null` when there's no preview. */
  previewUrl: string | null;

  regularPrice: Money;
  /** Present only when the product is on sale. */
  salePrice: Money | null;

  featured: boolean;
  /** ISO 8601 date. `null` when unreleased/unscheduled. */
  releaseDate: string | null;
}

/**
 * The product types this marketplace sells. A closed set by design — unlike
 * `fileFormat`, this list is a real business decision (it drives which UI
 * and filters exist), so it's worth the cost of a union type that must be
 * updated deliberately if the catalog grows.
 *
 * A string union rather than a TS `enum`, deliberately:
 * - It's the type GraphQL string values naturally satisfy — no mapping step
 *   between "what the API/mapper produces" and "what the type expects."
 * - `tsconfig.json` has `isolatedModules: true`, which rules out `const
 *   enum` outright (it requires whole-program knowledge to inline, which
 *   file-by-file transpilation can't provide); a regular `enum` would still
 *   work but adds a runtime object and an import for no behavior this
 *   union doesn't already have.
 *
 * Revisit this if `productType` needs attached runtime data (e.g. a
 * display label or icon per type) — though a `Record<ProductType, T>` map
 * usually covers that without an enum — or if WPGraphQL exposes this as a
 * real GraphQL `enum` type and a codegen tool is introduced that emits TS
 * enums for it.
 */
export type ProductType =
  | "sample-pack"
  | "drum-kit"
  | "midi-pack"
  | "preset"
  | "one-shot"
  | "construction-kit";

/** A term from a classification taxonomy — used for categories, genres, and tags. */
export interface TaxonomyTerm {
  id: string;
  name: string;
  slug: string;
}

/** The artist, sound designer, or label a product is attributed to. */
export interface Producer {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
}

export interface ProductImage {
  url: string;
  /** Accessible alt text. Empty string, not null, when none is set. */
  alt: string;
  width: number | null;
  height: number | null;
}

/**
 * A price as an amount + currency, not a formatted string. WooCommerce/WPGraphQL
 * returns prices pre-formatted for display (e.g. "$19.99") — the canonical
 * model needs the raw amount for sorting, comparison, and arithmetic, and
 * the currency to render it correctly regardless of store locale.
 */
export interface Money {
  amount: number;
  currency: string;
}
