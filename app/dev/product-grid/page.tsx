import { ProductGrid, ProductGridSkeleton } from "@/components/commerce/ProductGrid";
import { toProductCard } from "@/components/commerce/ProductCard";
import type { MusicProduct, ProductType } from "@/types/music-product";

/**
 * Temporary page to verify ProductGrid's responsive columns/gutter render
 * correctly against fixture data. Not linked from the app; safe to delete
 * once a real catalog page exercises the same path. Mirrors the existing
 * app/dev/products and app/dev/product-card convention.
 */
const TYPES: ProductType[] = [
  "sample-pack",
  "drum-kit",
  "midi-pack",
  "preset",
  "one-shot",
  "construction-kit",
];

function fixture(index: number): MusicProduct {
  const onSale = index % 3 === 0;
  return {
    id: String(index),
    databaseId: index,
    slug: `fixture-product-${index}`,
    title: `Fixture Product ${index}`,
    description: "",
    productType: TYPES[index % TYPES.length],
    categories: [],
    genres: [],
    tags: [],
    producer: {
      id: String(index),
      name: "Ujao Defined",
      slug: "ujao-defined",
      avatarUrl: null,
    },
    artwork: index % 4 === 0 ? null : { url: "/next.svg", alt: "", width: 400, height: 400 },
    gallery: [],
    bpm: null,
    musicalKey: null,
    fileFormat: [],
    duration: null,
    previewUrl: null,
    regularPrice: { amount: 19.99 + index, currency: "USD" },
    salePrice: onSale ? { amount: 14.99 + index, currency: "USD" } : null,
    featured: false,
    releaseDate: null,
  };
}

const FIXTURES: MusicProduct[] = Array.from({ length: 8 }, (_, i) => fixture(i + 1));

export default function ProductGridDevPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: "monospace", marginBottom: 24 }}>ProductGrid</h1>
      <ProductGrid products={FIXTURES.map(toProductCard)} />

      <h1 style={{ fontFamily: "monospace", margin: "48px 0 24px" }}>
        ProductGridSkeleton
      </h1>
      <ProductGridSkeleton count={4} />
    </div>
  );
}
