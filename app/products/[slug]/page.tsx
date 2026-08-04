import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "@/services/product.service";
import { ProductGallery, toProductGallery } from "@/components/commerce/ProductGallery";
import { ProductInfo, toProductInfo } from "@/components/commerce/ProductInfo";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Section } from "@/components/layout/Section";
import { routes } from "@/lib/config";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

/** Regex-strips tags for the plain-text `<meta name="description">` — distinct from ProductInfo's body rendering, which renders the same source HTML as-is (see docs/decisions.md's trust-boundary note). Search engines expect plain text here, not markup. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {};
  }

  const description = stripHtml(product.description).slice(0, 160) || undefined;

  return {
    title: product.title,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.artwork ? [product.artwork.url] : undefined,
    },
  };
}

/**
 * The storefront's second real page pattern (see docs/architecture.md,
 * "Page architecture patterns"): loading.tsx (Suspense) / error.tsx
 * (thrown errors) / not-found.tsx (`notFound()`) / generateMetadata,
 * mirroring feature/product-catalog's listing pattern but for a single
 * resource instead of a collection.
 *
 * No try/catch here, same reasoning as the catalog page: a thrown fetch
 * error propagates to error.tsx. `getProduct` returning `null` is a
 * different, valid state — handled with `notFound()`, not an error.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <Section>
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
    </Section>
  );
}
