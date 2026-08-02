/**
 * Barrel export for the configuration layer. Prefer importing from
 * `@/lib/config` over reaching into individual files, unless a
 * deep import materially improves clarity at the call site.
 */

export type {
  StoreConfig,
  StoreIdentity,
  StoreCurrency,
  StoreLocale,
  ContactInfo,
  SocialLinks,
  CatalogDefaults,
  SeoDefaults,
  FeatureFlags,
} from "./store";
export { storeConfig } from "./store";

export type { SlugPathBuilder } from "./routes";
export { routes } from "./routes";

export {
  layout,
  containerPadding,
  sectionSpacing,
  headerHeight,
  footerSpacing,
  artworkAspectRatio,
  productGridDefaults,
  animationDuration,
  zIndex,
} from "./theme";
