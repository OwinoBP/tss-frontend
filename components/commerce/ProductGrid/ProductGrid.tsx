import { ProductCard } from "@/components/commerce/ProductCard";
import type { ProductCardProps } from "@/components/commerce/ProductCard";
import { productGridDefaults } from "@/lib/config";
import { cn, toResponsiveVars } from "@/lib/utils";

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
 */
export function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <ul
      style={toResponsiveVars("product-grid-gutter", productGridDefaults.gutter)}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4",
        "gap-(--product-grid-gutter-mobile)",
        "md:gap-(--product-grid-gutter-tablet)",
        "lg:gap-(--product-grid-gutter-desktop)",
        "2xl:gap-(--product-grid-gutter-large-desktop)",
        className,
      )}
    >
      {products.map((product) => (
        <li key={product.href}>
          <ProductCard {...product} />
        </li>
      ))}
    </ul>
  );
}
