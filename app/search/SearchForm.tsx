import { Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routes } from "@/lib/config";

export interface SearchFormProps {
  /** @default "" */
  defaultQuery?: string;
}

/**
 * A plain GET form — submitting it is a real page navigation to
 * `/search?q=...`, so this needs no client-side JavaScript and page.tsx
 * stays a Server Component. Shared by app/search/page.tsx and
 * app/search/loading.tsx (the loading state renders it without a
 * `defaultQuery`, since loading.tsx has no access to searchParams) so the
 * form doesn't appear/disappear between the two, matching this project's
 * existing loading-state-must-match-real-layout convention
 * (ProductGridSkeleton).
 */
export function SearchForm({ defaultQuery = "" }: SearchFormProps) {
  return (
    <form
      action={routes.searchPath()}
      method="GET"
      role="search"
      className="flex gap-2"
    >
      <Input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder="Search products…"
        aria-label="Search products"
        className="flex-1"
      />
      <Button type="submit">
        <SearchIcon aria-hidden="true" />
        Search
      </Button>
    </form>
  );
}
