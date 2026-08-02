import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { routes } from "@/lib/config";
import type { ProductType } from "@/types/music-product";

interface ProductTypeLink {
  slug: ProductType;
  label: string;
}

/**
 * Display labels for the six `ProductType` values (types/music-product.ts).
 * Colocated here rather than in `data/`, matching Navigation's own
 * DEFAULT_ITEMS precedent (components/layout/Navigation/Navigation.tsx) —
 * this list has exactly one consumer today.
 */
const PRODUCT_TYPES: ProductTypeLink[] = [
  { slug: "sample-pack", label: "Sample Packs" },
  { slug: "drum-kit", label: "Drum Kits" },
  { slug: "midi-pack", label: "MIDI Packs" },
  { slug: "preset", label: "Presets" },
  { slug: "one-shot", label: "One-Shots" },
  { slug: "construction-kit", label: "Construction Kits" },
];

/**
 * Text-only catalog navigation by `productType` — no artwork or live product
 * data (ProductCard/ProductGrid don't exist yet, see docs/decisions.md).
 * The first real caller of `routes.productTypes.detailPath`.
 */
export function ShopByType() {
  return (
    <Section heading="Shop by Type">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {PRODUCT_TYPES.map((type) => (
          <li key={type.slug}>
            <Link
              href={routes.productTypes.detailPath(type.slug)}
              className="group flex items-center justify-between gap-2 rounded-xl border border-border p-4 outline-none transition-colors hover:border-foreground/20 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="text-[1.25rem] leading-[1.3] font-medium text-foreground">
                {type.label}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
