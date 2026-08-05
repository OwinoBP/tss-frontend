import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategory } from "@/services/category.service";
import { getProductsPage } from "@/services/product.service";
import { toProductCard } from "@/components/commerce/ProductCard";
import { ProductGrid } from "@/components/commerce/ProductGrid";
import { Breadcrumbs, type Breadcrumb } from "@/components/common/Breadcrumbs";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { routes, storeConfig } from "@/lib/config";
import { stripHtml } from "@/lib/strip-html";
import type { Category } from "@/types/category";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ after?: string }>;
}

/**
 * Rendered inline for a category slug that doesn't exist — deliberately
 * NOT `notFound()`/`not-found.tsx`, unlike app/products/[slug]. Confirmed
 * live (dev *and* production build) that this Next.js version treats the
 * mere presence of a `not-found.tsx` file in a route segment as license to
 * route *any* uncaught error in that segment — including a genuine
 * backend-unreachable failure from `getProductsPage` below, unrelated to
 * `getCategory` entirely — to the not-found boundary instead of
 * error.tsx. That's a real correctness problem (an outage would show
 * "category not found" instead of a retry affordance), so this route
 * doesn't use `not-found.tsx` at all. See docs/decisions.md, "Category
 * Pages" for how this was isolated and confirmed, including that the same
 * defect already exists in the shipped app/products/[slug].
 */
function CategoryNotFound() {
  return (
    <Section heading="Category not found">
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a category at this address — it may have
          been removed or the link may be out of date.
        </p>
        <Button asChild variant="outline">
          <Link href={routes.products.index}>Browse all products</Link>
        </Button>
      </div>
    </Section>
  );
}

function categoryBreadcrumbs(category: Category): Breadcrumb[] {
  return [
    { label: "Home", href: routes.home },
    { label: "Categories", href: routes.categories.index },
    ...category.ancestors.map((ancestor) => ({
      label: ancestor.name,
      href: routes.categories.detailPath(ancestor.slug),
    })),
    { label: category.name, href: null },
  ];
}

/**
 * Page one is indexed, like app/products (a real, stable landing page for
 * this category) — not blanket-`noindex`ed like app/search, which is
 * conventionally-excluded internal search rather than a real merchandising
 * URL. `after` (page 2+) stays non-canonical for the same reason it does on
 * app/products: forward-only cursor pagination has no stable per-page URL
 * worth indexing separately. See docs/decisions.md, "Category Pages".
 */
export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { after } = await searchParams;
  const category = await getCategory(slug);

  if (!category) {
    // No not-found.tsx for this route (see CategoryNotFound's doc comment) —
    // Next won't inject noindex/404 automatically the way it does for a
    // real notFound(), so this is set explicitly instead.
    return { title: "Category not found", robots: { index: false, follow: true } };
  }

  // WooCommerce categories are very often left without a description —
  // storeConfig's store-wide default keeps that from ever being an empty
  // <meta name="description">.
  const description = category.description
    ? stripHtml(category.description).slice(0, 160)
    : storeConfig.seo.defaultDescription;

  return {
    title: category.name,
    description,
    openGraph: {
      title: category.name,
      description,
      images: category.image ? [category.image.url] : undefined,
    },
    ...(after
      ? {
          alternates: { canonical: routes.categories.detailPath(slug) },
          robots: { index: false, follow: true },
        }
      : {}),
  };
}

/**
 * A category page is conceptually a Detail page for the category term
 * itself (exists or doesn't) composed with a Listing page for its products
 * (empty is a valid business state, cursor pagination, same
 * service/mapper/ProductGrid pipeline as app/products and app/search) —
 * not a third page pattern. See docs/architecture.md, "Page architecture
 * patterns" and docs/decisions.md, "Category Pages".
 *
 * Unlike app/products/[slug], "category doesn't exist" is rendered
 * inline (`CategoryNotFound`) rather than via `notFound()`/`not-found.tsx`
 * — see that component's doc comment for the confirmed Next.js behavior
 * this avoids. Every other state follows the established pattern
 * unchanged: no try/catch, so a thrown fetch error (from `getCategory` or
 * `getProductsPage`) propagates to error.tsx; zero products in a category
 * that *does* exist is a plain empty-state conditional, never routed
 * through error.tsx.
 */
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { after } = await searchParams;

  const category = await getCategory(slug);
  if (!category) {
    return <CategoryNotFound />;
  }

  const { products, pageInfo } = await getProductsPage({
    where: { category: slug },
    after: after ?? null,
  });

  return (
    <Section heading={category.name}>
      <Breadcrumbs className="mb-8" items={categoryBreadcrumbs(category)} />
      {category.description ? (
        <p className="mb-8 max-w-[65ch] text-lg text-muted-foreground">
          {stripHtml(category.description)}
        </p>
      ) : null}

      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No products in this category yet.
        </p>
      ) : (
        <>
          <ProductGrid products={products.map(toProductCard)} />
          {pageInfo.hasNextPage && pageInfo.endCursor ? (
            <div className="mt-8 flex justify-center">
              <Button asChild variant="outline">
                <Link
                  href={`${routes.categories.detailPath(slug)}?after=${encodeURIComponent(pageInfo.endCursor)}`}
                >
                  Next
                  <ArrowRight aria-hidden="true" data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          ) : null}
        </>
      )}
    </Section>
  );
}
