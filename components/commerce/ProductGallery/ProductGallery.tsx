import { ProductImage } from "@/components/commerce/ProductImage";
import type { ProductGalleryProps } from "./ProductGallery.types";

/**
 * Arranges a product's primary image plus any additional gallery images —
 * layout only. Image rendering rules (real photo vs. placeholder, aspect
 * ratio) live in `ProductImage`, not here, so this stays a thin
 * composition rather than accumulating that logic itself.
 *
 * No click-to-swap/lightbox interactivity this pass — secondary images
 * are static. There's no real multi-image product yet to validate that
 * UX against (see docs/decisions.md), and it would be the only reason
 * this component would need to become a Client Component.
 */
export function ProductGallery({ primary, secondary }: ProductGalleryProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProductImage
        artwork={primary}
        priority
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="rounded-xl"
      />

      {secondary.length > 0 ? (
        <ul className="grid grid-cols-4 gap-2">
          {secondary.map((image) => (
            <li key={image.url}>
              <ProductImage artwork={image} sizes="120px" className="rounded-lg" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
