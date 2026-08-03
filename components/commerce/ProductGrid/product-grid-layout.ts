import type { CSSProperties } from "react";
import { productGridDefaults } from "@/lib/config";
import { toResponsiveVars } from "@/lib/utils";

/**
 * The grid container className + style shared by `ProductGrid` and
 * `ProductGridSkeleton`. Extracted once both needed the exact same
 * responsive grid (columns + gutter) — a loading skeleton that doesn't
 * match its loaded layout pixel-for-pixel causes a layout shift the
 * instant real content arrives, which defeats the point of a skeleton.
 *
 * See ProductGrid.tsx for why columns are literal Tailwind classes while
 * gutter uses the `toResponsiveVars` custom-property technique.
 */
export const PRODUCT_GRID_CLASSNAME =
  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 " +
  "gap-(--product-grid-gutter-mobile) md:gap-(--product-grid-gutter-tablet) " +
  "lg:gap-(--product-grid-gutter-desktop) 2xl:gap-(--product-grid-gutter-large-desktop)";

export function productGridStyle(): CSSProperties {
  return toResponsiveVars("product-grid-gutter", productGridDefaults.gutter);
}
