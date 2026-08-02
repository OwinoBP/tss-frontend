import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/Section";
import { routes, storeConfig, layout } from "@/lib/config";

/**
 * Enumerates the six `ProductType` values (types/music-product.ts) as a
 * plain-language catalog-scope line — factual, not invented marketing copy.
 */
const CATALOG_SCOPE =
  "Sample Packs · Drum Kits · MIDI Packs · Presets · One-Shots · Construction Kits";

/**
 * The page's single H1 and primary CTA pair. No product data — ProductCard
 * doesn't exist yet (see docs/decisions.md, "Homepage: editorial shell
 * only"). `storeConfig.identity.tagline` is written for customer-facing use;
 * `identity.description` is not (it names "headless WooCommerce", an
 * implementation detail) and is deliberately not used here.
 */
export function Hero() {
  return (
    <Section>
      <div
        className="flex flex-col gap-6"
        style={{ maxWidth: layout.readingWidth }}
      >
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {CATALOG_SCOPE}
        </p>
        <h1 className="text-[2.5rem] leading-[1.1] font-semibold tracking-[-0.02em] text-foreground sm:text-[3rem] lg:text-[4rem] lg:leading-[1.05]">
          {storeConfig.identity.tagline}
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={routes.products.index}>Shop the catalog</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={routes.productTypes.index}>Browse by type</Link>
          </Button>
        </div>
      </div>
    </Section>
  );
}
