/** A single displayable image — the shape both ProductCard and ProductGallery need, nothing more. */
export interface ProductImageSource {
  url: string;
  /** Always meaningful, never empty — populated by each caller's presentation mapper (never left as WooCommerce's possibly-empty alt text). */
  alt: string;
}

export interface ProductImageProps {
  /** `null` renders the placeholder fill — never a fake/stock image. */
  artwork: ProductImageSource | null;
  /** Passed straight to `next/image`'s `sizes` — differs by where this renders (grid card, gallery hero, thumbnail strip), so there's no sensible shared default. */
  sizes: string;
  /** Set for the single largest above-the-fold image on a page (e.g. a gallery's primary image). @default false */
  priority?: boolean;
  className?: string;
}
