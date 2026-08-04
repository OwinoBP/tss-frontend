import Image from "next/image";
import { Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductImageProps } from "./ProductImage.types";

/**
 * A single product image, 1:1 (docs/design-system.md, "Image ratio"), or
 * a quiet `--muted` placeholder when there's none — never a fake/stock
 * image. The one place this rendering rule lives: `ProductCard` and
 * `ProductGallery` both compose this rather than each carrying their own
 * copy of "real image vs. placeholder" logic.
 *
 * `className` applies to the outer clipping container (not just the
 * `<Image>`) so both branches — real photo or placeholder — pick up
 * whatever the caller needs (rounded corners when there's no ancestor
 * already clipping, a hover-scale transform, etc.) identically, rather
 * than the placeholder silently not matching.
 */
export function ProductImage({ artwork, sizes, priority = false, className }: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden bg-muted",
        className,
      )}
    >
      {artwork ? (
        <Image
          src={artwork.url}
          alt={artwork.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Music2 aria-hidden="true" className="size-8 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}
