/**
 * Store-level configuration — identity, defaults, and feature toggles for
 * a single storefront instance.
 *
 * `StoreConfig` is exported separately from `storeConfig` (the TSS
 * instance of it) on purpose: this project's frontend is meant to support
 * future Maabara storefronts beyond TSS, and a second storefront should
 * be able to define its own object of this same shape rather than this
 * file growing conditionals for a second brand.
 *
 * This is application configuration, not environment configuration — see
 * `lib/env.ts` for values that come from `process.env` (the GraphQL
 * endpoint, etc.). Nothing here should read `process.env`.
 */

export interface StoreIdentity {
  /** Stable slug identifying this storefront instance (e.g. for a future multi-store lookup). */
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
}

export interface StoreCurrency {
  /** ISO 4217 currency code. Formatting (symbol, decimal style) should be derived from this via `Intl.NumberFormat`, not stored separately. */
  code: string;
}

export interface StoreLocale {
  /** BCP 47 locale tag used for formatting (prices, dates) when no request-specific locale is available. */
  default: string;
}

export interface ContactInfo {
  supportEmail: string;
  phone: string | null;
}

/** All optional — only set the platforms the store actually has a profile on. */
export interface SocialLinks {
  instagram?: string;
  x?: string;
  youtube?: string;
  tiktok?: string;
}

export interface CatalogDefaults {
  /** Default page size for product listing queries (see services/product.service.ts). */
  productsPerPage: number;
}

export interface SeoDefaults {
  /** `%s` is replaced with the page-specific title. */
  titleTemplate: string;
  defaultDescription: string;
  /** Path under /public. The referenced file doesn't exist yet — see follow-up recommendations. */
  defaultOgImage: string;
}

/**
 * Toggles for features that don't exist in the UI yet, so components can
 * check a flag instead of the codebase growing dead conditional branches
 * for unfinished work. Each one maps to something already planned
 * elsewhere in the project — not speculative.
 */
export interface FeatureFlags {
  /** Gates the (future) wishlist route — see lib/config/routes.ts. */
  wishlist: boolean;
  /** Gates the (future) search route — see lib/config/routes.ts. */
  search: boolean;
  /** Gates displaying `averageRating`/`reviewCount` — see docs/product-model.md, Future Extensions. */
  reviews: boolean;
  /** Gates playback UI for `MusicProduct.previewUrl` — see types/music-product.ts. */
  audioPreview: boolean;
  /** Gates the (future) account route — see lib/config/routes.ts. */
  accounts: boolean;
}

export interface StoreConfig {
  identity: StoreIdentity;
  currency: StoreCurrency;
  locale: StoreLocale;
  contact: ContactInfo;
  social: SocialLinks;
  catalog: CatalogDefaults;
  seo: SeoDefaults;
  features: FeatureFlags;
}

export const storeConfig: StoreConfig = {
  identity: {
    id: "tss",
    name: "TSS Music Store",
    shortName: "TSS",
    tagline: "Sample packs, drum kits, and presets for producers.",
    description:
      "A headless WooCommerce music marketplace — sample packs, drum kits, MIDI packs, presets, one-shots, and construction kits.",
  },
  currency: {
    code: "USD",
  },
  locale: {
    default: "en-US",
  },
  contact: {
    // TODO: placeholder — replace with the client's real support contact.
    supportEmail: "support@example.com",
    phone: null,
  },
  // TODO: no confirmed social profiles yet — add as they're provided.
  social: {},
  catalog: {
    productsPerPage: 20,
  },
  seo: {
    titleTemplate: "%s | TSS Music Store",
    defaultDescription:
      "A headless WooCommerce music marketplace for producers.",
    defaultOgImage: "/og-default.png",
  },
  features: {
    wishlist: false,
    search: false,
    reviews: false,
    audioPreview: false,
    accounts: false,
  },
};
