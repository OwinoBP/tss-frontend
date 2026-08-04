import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Breadcrumb {
  label: string;
  /** `null` for the current page — rendered as plain text, not a link. */
  href: string | null;
}

export interface BreadcrumbsProps {
  items: Breadcrumb[];
  className?: string;
}

/**
 * Generic breadcrumb trail — no product/commerce knowledge, reusable by
 * any page more than two levels from home. Per docs/design-system.md's
 * Navigation Principles ("Breadcrumbs for depth... e.g. Category ->
 * Product"): Caption style, a plain "/" separator, no decoration beyond
 * that. First used by the product detail page
 * (Home -> Products -> [product]), the exact depth that rule describes.
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {item.href ? (
              <Link
                href={item.href}
                className={cn(
                  "rounded-sm underline-offset-4 outline-none",
                  "transition-colors hover:text-foreground hover:underline",
                  "focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
