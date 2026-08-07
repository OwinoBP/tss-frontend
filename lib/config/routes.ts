/**
 * Centralized route definitions. Nothing in the app should write a route
 * path as a string literal — import from here instead, so a URL structure
 * change is a one-file edit, not a find-and-replace across every `<Link>`.
 *
 * None of these paths have a corresponding page in `app/` yet — this
 * branch is infrastructure only (see docs/component-principles.md). Static
 * routes are plain strings; routes that need an identifier are functions,
 * consistently named `*Path`, so a call site always makes clear whether a
 * value is a ready-to-use path or needs an argument.
 */

/** The shape shared by every "detail page" route below — builds a path from a slug. */
export type SlugPathBuilder = (slug: string) => string;

export const routes = {
  home: "/",

  products: {
    index: "/products",
    detailPath: (slug: string): string => `/products/${slug}`,
  },

  categories: {
    index: "/categories",
    detailPath: (slug: string): string => `/categories/${slug}`,
  },

  /** The music-domain `productType` (sample pack, drum kit, etc.) — see types/music-product.ts. Not WooCommerce's own product type. */
  productTypes: {
    index: "/product-types",
    detailPath: (slug: string): string => `/product-types/${slug}`,
  },

  producers: {
    index: "/producers",
    detailPath: (slug: string): string => `/producers/${slug}`,
  },

  about: "/about",
  contact: "/contact",

  /** `query` is optional so `routes.searchPath()` alone still gives a valid link to the search page. */
  searchPath: (query?: string): string =>
    query ? `/search?q=${encodeURIComponent(query)}` : "/search",

  cart: "/cart",
  checkout: "/checkout",
  /** Query params (total/currency/status/paymentMethodTitle) are appended by the caller — see `lib/actions/checkout.actions.ts`, docs/decisions.md, "Checkout". */
  checkoutSuccessPath: (orderNumber: string): string => `/checkout/success/${encodeURIComponent(orderNumber)}`,

  /** Future — gated behind `storeConfig.features.accounts` (lib/config/store.ts) until account pages exist. */
  account: "/account",
  /** Future — gated behind `storeConfig.features.wishlist` (lib/config/store.ts) until the wishlist page exists. */
  wishlist: "/wishlist",
} as const;
