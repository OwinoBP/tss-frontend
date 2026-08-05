import { query } from "@/lib/apollo/rsc-client";
import { CATEGORY_QUERY } from "@/graphql/queries/category.query";
import { mapWooCommerceCategoryToCategory } from "@/services/mappers/category.mapper";
import type { Category } from "@/types/category";

// Category service
//
// The entry point UI code uses to read a WooCommerce category's own
// metadata (name, description, breadcrumb ancestry) — a different
// capability from `product.service.ts`'s `getProductsPage`/`getProducts`,
// which fetch products, optionally filtered by category via
// `GetProductsParams.where.category`. A category page composes both:
// this for the heading/breadcrumbs/SEO, `getProductsPage` for the listing.
// See docs/decisions.md, "Category Pages".

/**
 * Fetches a single category by slug, or `null` if none exists.
 *
 * Uses `errorPolicy: "none"` (Apollo's default, made explicit here, matching
 * `getProductsPage`'s convention), unlike `getProduct`'s
 * `errorPolicy: "all"` — confirmed live against the real WPGraphQL
 * endpoint that `productCategory(idType: SLUG)` returns a clean
 * `{ productCategory: null }` for a nonexistent slug, with no GraphQL
 * error attached (a real difference from `product(idType: SLUG)`, not an
 * assumption carried over from that case). So there's no "not found vs.
 * request failed" ambiguity to resolve here: a thrown error always means
 * the request itself failed and should reach `error.tsx`; a `null`
 * `productCategory` always means "this category doesn't exist," and the
 * caller should call `notFound()`.
 */
export async function getCategory(slug: string): Promise<Category | null> {
  const { data } = await query({
    query: CATEGORY_QUERY,
    variables: { slug },
    errorPolicy: "none",
  });

  return data.productCategory
    ? mapWooCommerceCategoryToCategory(data.productCategory)
    : null;
}
