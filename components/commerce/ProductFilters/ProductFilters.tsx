import { SORT_OPTIONS } from "@/data/sort-options";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ProductFilterState } from "@/lib/product-filters";

export interface ProductFiltersProps {
  /** Where the form submits — e.g. `routes.products.index`, `routes.searchPath()`, `routes.categories.detailPath(slug)`. */
  action: string;
  state: ProductFilterState;
  /**
   * Extra params to preserve across a filter submit that aren't part of
   * filter state itself (`q`, on `app/search`). Deliberately no `after`
   * slot: submitting this form always drops pagination, since a changed
   * filter/sort invalidates any prior cursor — the same behavior
   * `SearchForm` already has for a resubmitted query.
   */
  hiddenFields?: Record<string, string>;
  className?: string;
}

const SELECT_CLASSNAME =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

/**
 * A plain GET form — submitting it is a real page navigation with a new
 * query string, so this needs no client-side JavaScript, matching
 * `SearchForm`'s existing zero-JS precedent (an explicit "Apply" submit
 * rather than auto-submit-on-change, a deliberate choice — see
 * docs/decisions.md, "Filtering and Sorting"). Shared by `app/products`,
 * `app/search`, and `app/categories/[slug]` — three consumers across
 * different route segments is what promotes this to `components/commerce/`
 * rather than colocating it like `SearchForm` (two consumers, one route
 * segment). Renders in each page's `loading.tsx` too, without a real
 * `state`'s non-default values necessarily reflected yet in some cases,
 * same "loading state matches real layout" rule already applied to
 * `ProductGridSkeleton`/`SearchForm`.
 *
 * No `<select>`/checkbox shadcn primitive exists yet in `components/ui/` —
 * styled here as plain native elements matching `Input`'s own focus-ring
 * and sizing classes rather than introducing a new UI dependency for a
 * two-field need.
 */
export function ProductFilters({ action, state, hiddenFields = {}, className }: ProductFiltersProps) {
  return (
    <form action={action} method="GET" className={cn("flex flex-wrap items-end gap-4", className)}>
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="flex flex-col gap-2">
        <label htmlFor="sort" className="text-xs font-medium text-muted-foreground">
          Sort by
        </label>
        <select id="sort" name="sort" defaultValue={state.sortKey} className={SELECT_CLASSNAME}>
          {Object.entries(SORT_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="minPrice" className="text-xs font-medium text-muted-foreground">
          Min price
        </label>
        <Input
          id="minPrice"
          type="number"
          name="minPrice"
          min={0}
          step="0.01"
          defaultValue={state.minPrice}
          placeholder="0"
          className="w-24"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="maxPrice" className="text-xs font-medium text-muted-foreground">
          Max price
        </label>
        <Input
          id="maxPrice"
          type="number"
          name="maxPrice"
          min={0}
          step="0.01"
          defaultValue={state.maxPrice}
          placeholder="Any"
          className="w-24"
        />
      </div>

      <div className="flex items-center gap-2 pb-1.5">
        <input
          id="onSale"
          type="checkbox"
          name="onSale"
          value="1"
          defaultChecked={state.onSale}
          className="size-4 rounded border-input outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <label htmlFor="onSale" className="text-sm text-foreground">
          On sale only
        </label>
      </div>

      <Button type="submit" variant="outline" size="sm">
        Apply
      </Button>
    </form>
  );
}
