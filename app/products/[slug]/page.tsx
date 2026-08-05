import type { Metadata } from "next";
import { getProduct } from "@/services/product.service";
import { ProductGallery, toProductGallery } from "@/components/commerce/ProductGallery";
import { ProductInfo, toProductInfo } from "@/components/commerce/ProductInfo";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { DetailNotFound, DETAIL_NOT_FOUND_METADATA } from "@/components/common/DetailNotFound";
import { Section } from "@/components/layout/Section";
import { routes } from "@/lib/config";
import { stripHtml } from "@/lib/strip-html";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return { title: "Product not found", ...DETAIL_NOT_FOUND_METADATA };
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
 * The storefront's canonical Detail Page Pattern (see docs/architecture.md,
 * "Page architecture patterns" and docs/decisions.md, "Detail Page Pattern
 * Hardening"): loading.tsx (Suspense) / error.tsx (thrown errors) / an
 * inline `DetailNotFound` conditional / generateMetadata. Deliberately
 * NOT `notFound()`/`not-found.tsx` — a confirmed Next.js defect causes a
 * route segment's mere possession of a `not-found.tsx` file to swallow
 * *any* uncaught error in that segment into the not-found boundary
 * instead of error.tsx, not just a real `notFound()` call. Same pattern
 * as `app/categories/[slug]`, the first page this was worked out for.
 *
 * No try/catch here, same reasoning as the catalog page: a thrown fetch
 * error propagates to error.tsx. `getProduct` returning `null` is a
 * different, valid state — handled by rendering `DetailNotFound`, not an
 * error.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <DetailNotFound
        title="Product not found"
        message="We couldn't find a product at this address — it may have been removed or the link may be out of date."
        actionLabel="Browse all products"
        actionHref={routes.products.index}
      />
    );
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
