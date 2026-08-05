import type { Category } from "@/types/category";
import type { TaxonomyTerm } from "@/types/music-product";
import type {
  WooCommerceCategoryDto,
  WooCommerceCategoryTermRefDto,
} from "@/types/dto/woocommerce-category.dto";
import { mapWooCommerceImage } from "@/services/mappers/media.mapper";

// Category mapper
//
// Transforms a WooCommerceCategoryDto (types/dto/woocommerce-category.dto.ts)
// into the canonical Category (types/category.ts). Pure — no Apollo, no
// React, no I/O. Mirrors product.mapper.ts's shape for the same reasons
// (see docs/api/product-query.md and docs/architecture.md).

export function mapWooCommerceCategoryToCategory(
  dto: WooCommerceCategoryDto,
): Category {
  return {
    id: dto.id,
    name: dto.name ?? "Untitled Category",
    slug: dto.slug ?? String(dto.databaseId),
    description: dto.description ?? "",
    image: dto.image ? mapWooCommerceImage(dto.image) : null,
    parent: dto.parent ? mapTermRef(dto.parent.node) : null,
    // Confirmed live: WPGraphQL's `ancestors` connection is ordered
    // immediate-parent-first (nearest ancestor at index 0, root last) —
    // reversed here so callers building a breadcrumb trail can render
    // `ancestors` directly in root-to-leaf order. See docs/decisions.md.
    ancestors: dto.ancestors.nodes.map(mapTermRef).reverse(),
  };
}

function mapTermRef(term: WooCommerceCategoryTermRefDto): TaxonomyTerm {
  return {
    id: term.id,
    name: term.name ?? "",
    slug: term.slug ?? "",
  };
}
