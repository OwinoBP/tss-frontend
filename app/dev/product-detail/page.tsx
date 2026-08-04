import { ProductGallery, toProductGallery } from "@/components/commerce/ProductGallery";
import { ProductInfo, toProductInfo } from "@/components/commerce/ProductInfo";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { routes } from "@/lib/config";
import type { MusicProduct } from "@/types/music-product";

/**
 * Temporary page to verify ProductGallery + ProductInfo (and their
 * mappers) render correctly against fixture data, in isolation from a
 * live backend. Not linked from the app; safe to delete once confident
 * the real /products/[slug] route continues to exercise the same path.
 * Mirrors the existing app/dev/product-card convention.
 */
const FIXTURE: MusicProduct = {
  id: "1",
  slug: "midnight-drums",
  title: "Midnight Drums Vol. 1",
  description:
    "<p>A collection of <strong>24 drum loops</strong> and one-shots recorded through analog tape saturation for a warm, vintage character.</p><ul><li>24 loops, 32 one-shots</li><li>WAV, 24-bit / 44.1kHz</li><li>Royalty-free</li></ul>",
  productType: "drum-kit",
  categories: [
    { id: "1", name: "Drum Kits", slug: "drum-kits" },
    { id: "2", name: "Lo-Fi", slug: "lo-fi" },
  ],
  genres: [],
  tags: [
    { id: "1", name: "Vintage", slug: "vintage" },
    { id: "2", name: "Tape", slug: "tape" },
    { id: "3", name: "Warm", slug: "warm" },
  ],
  producer: { id: "1", name: "Ujao Defined", slug: "ujao-defined", avatarUrl: null },
  artwork: { url: "/next.svg", alt: "", width: 800, height: 800 },
  gallery: [
    { url: "/vercel.svg", alt: "", width: 800, height: 800 },
    { url: "/globe.svg", alt: "", width: 800, height: 800 },
    { url: "/file.svg", alt: "", width: 800, height: 800 },
  ],
  bpm: null,
  musicalKey: null,
  fileFormat: [],
  duration: null,
  previewUrl: null,
  regularPrice: { amount: 29.99, currency: "USD" },
  salePrice: { amount: 19.99, currency: "USD" },
  featured: false,
  releaseDate: null,
};

const NO_ARTWORK_FIXTURE: MusicProduct = {
  ...FIXTURE,
  id: "2",
  slug: "no-artwork-preset",
  title: "Analog Warmth Presets",
  description: "<p>No gallery, no artwork — verifying the placeholder path.</p>",
  categories: [],
  tags: [],
  artwork: null,
  gallery: [],
  salePrice: null,
};

export default function ProductDetailDevPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: "monospace", marginBottom: 24 }}>
        ProductGallery + ProductInfo
      </h1>

      {[FIXTURE, NO_ARTWORK_FIXTURE].map((product) => (
        <div key={product.id} style={{ marginBottom: 64 }}>
          <Breadcrumbs
            className="mb-8"
            items={[
              { label: "Home", href: routes.home },
              { label: "Products", href: routes.products.index },
              { label: product.title, href: null },
            ]}
          />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery {...toProductGallery(product)} />
            <ProductInfo {...toProductInfo(product)} />
          </div>
        </div>
      ))}
    </div>
  );
}
