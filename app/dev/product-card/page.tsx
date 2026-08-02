import { ProductCard, toProductCard } from "@/components/commerce/ProductCard";
import type { MusicProduct } from "@/types/music-product";

/**
 * Temporary page to verify ProductCard + toProductCard render correctly
 * end to end against fixture MusicProduct data (the store has no real
 * products yet — see docs/decisions.md). Not linked from the app; safe to
 * delete once a real product grid/catalog exercises the same path. Mirrors
 * the existing app/dev/products convention.
 */
function fixture(overrides: Partial<MusicProduct>): MusicProduct {
  return {
    id: "1",
    slug: "midnight-drums",
    title: "Midnight Drums Vol. 1",
    description: "",
    productType: "drum-kit",
    categories: [],
    genres: [],
    tags: [],
    producer: { id: "1", name: "Ujao Defined", slug: "ujao-defined", avatarUrl: null },
    artwork: {
      url: "/next.svg",
      alt: "",
      width: 400,
      height: 400,
    },
    gallery: [],
    bpm: null,
    musicalKey: null,
    fileFormat: [],
    duration: null,
    previewUrl: null,
    regularPrice: { amount: 29.99, currency: "USD" },
    salePrice: null,
    featured: false,
    releaseDate: null,
    ...overrides,
  };
}

const FIXTURES: MusicProduct[] = [
  fixture({}),
  fixture({
    id: "2",
    slug: "trap-essentials-sale",
    title: "Trap Essentials — A Very Long Title That Should Truncate Past Two Lines",
    productType: "sample-pack",
    regularPrice: { amount: 39.99, currency: "USD" },
    salePrice: { amount: 24.99, currency: "USD" },
  }),
  fixture({
    id: "3",
    slug: "no-artwork-preset",
    title: "Analog Warmth Presets",
    productType: "preset",
    artwork: null,
  }),
];

export default function ProductCardDevPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: "monospace", marginBottom: 24 }}>ProductCard</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 280px))",
          gap: 24,
        }}
      >
        {FIXTURES.map((product) => (
          <ProductCard key={product.id} {...toProductCard(product)} />
        ))}
      </div>
    </div>
  );
}
