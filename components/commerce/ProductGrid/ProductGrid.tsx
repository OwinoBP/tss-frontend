import { ProductCard } from "@/components/commerce/ProductCard";
import type { ProductCardProps } from "@/components/commerce/ProductCard";
import { PRODUCT_GRID_CLASSNAME, productGridStyle } from "./product-grid-layout";
import { cn } from "@/lib/utils";

export interface ProductGridProps {
  /** Already-mapped card data — see product-card.mapper.ts. `ProductGrid` never sees `MusicProduct`. */
  products: ProductCardProps[];
  className?: string;
}

/**
 * Purely presentational: arranges whatever `ProductCardProps` it's given
 * into a responsive grid. No fetching, no pagination, no loading/empty
 * state — those belong to whatever page composes this (feature/product-catalog,
 * a future "related products" rail, etc.), not to the grid itself. See
 * docs/decisions.md for why this stays this dumb on purpose.
 *
 * Gutter comes from `lib/config/theme.ts`'s `productGridDefaults.gutter`,
 * applied via the same `toResponsiveVars` + Tailwind custom-property
 * technique `Container`/`Section`/`Footer` already use for responsive
 * theme.ts values. Column counts are literal Tailwind classes
 * (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4`, matching
 * `productGridDefaults.columns`) rather than the same var technique:
 * `grid-template-columns` needs a full track list
 * (`repeat(N, minmax(0, 1fr))`), and a bare `var(--x)` substituting just
 * the number `N` compiles but is invalid CSS — confirmed by inspecting
 * the actual compiled output, not assumed (see docs/decisions.md).
 *
 * Layout (className + style) lives in `product-grid-layout.ts`, shared
 * with `ProductGridSkeleton` so a loading state never drifts out of sync
 * with its loaded layout.
 */
export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <ul
      style={productGridStyle()}
      className={cn(PRODUCT_GRID_CLASSNAME, className)}
    >
      {products.map((product) => (
        <li key={product.href}>
          <ProductCard {...product} />
        </li>
      ))}
    </ul>
  );
}
