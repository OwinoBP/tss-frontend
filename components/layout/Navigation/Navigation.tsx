import Link from "next/link";
import { routes } from "@/lib/config";
import { cn } from "@/lib/utils";

export interface NavigationItem {
  label: string;
  href: string;
}

/**
 * Primary (catalog) navigation only — docs/design-system.md's Navigation
 * Principles distinguish primary nav (catalog sections) from utility nav
 * (search, cart, account). Utility items aren't included here: search,
 * cart, checkout, and account are explicitly out of scope for this branch
 * (see docs/decisions.md) — a nav item linking to an unbuilt commerce
 * feature isn't "establishing the navigation API," it's stubbing commerce
 * UI early.
 */
const DEFAULT_ITEMS: NavigationItem[] = [
  { label: "Products", href: routes.products.index },
  { label: "Categories", href: routes.categories.index },
  { label: "Product Types", href: routes.productTypes.index },
  { label: "Producers", href: routes.producers.index },
  { label: "About", href: routes.about },
  { label: "Contact", href: routes.contact },
];

export interface NavigationProps {
  /** Overrides the default catalog-derived item list. @default DEFAULT_ITEMS */
  items?: NavigationItem[];
  className?: string;
}

/**
 * The navigation structure only — no mobile drawer yet (see task scope).
 * Plain semantic links (`<nav><ul><li><a>`), so keyboard operability
 * (tab order, Enter to activate) comes from the browser for free; no
 * custom key handling is needed for a flat link list like this one.
 */
export function Navigation({ items = DEFAULT_ITEMS, className }: NavigationProps) {
  return (
    <nav aria-label="Primary" data-slot="navigation" className={className}>
      <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "text-sm font-medium text-foreground underline-offset-4 outline-none",
                "transition-colors hover:underline",
                "rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
