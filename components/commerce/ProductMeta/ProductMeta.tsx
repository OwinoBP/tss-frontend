import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { ProductMetaProps } from "./ProductMeta.types";

/**
 * Secondary product metadata — producer, type, categories, tags — grouped
 * separately from ProductInfo's title/price/description so that block
 * stays focused on the primary purchase decision, per the reviewer's
 * request to keep detail-page metadata composable on its own rather than
 * folded permanently into ProductInfo.
 */
export function ProductMeta({ producer, productType, categories, tags }: ProductMetaProps) {
  return (
    <dl className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
      <div className="flex gap-2">
        <dt className="w-24 shrink-0 text-muted-foreground">Producer</dt>
        <dd className="text-foreground">
          {producer.href ? (
            <Link
              href={producer.href}
              className="rounded-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {producer.name}
            </Link>
          ) : (
            producer.name
          )}
        </dd>
      </div>

      <div className="flex gap-2">
        <dt className="w-24 shrink-0 text-muted-foreground">Type</dt>
        <dd className="text-foreground">{productType}</dd>
      </div>

      {categories.length > 0 ? (
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 pt-0.5 text-muted-foreground">Categories</dt>
          <dd className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge key={category.href} variant="outline" asChild>
                <Link href={category.href}>{category.name}</Link>
              </Badge>
            ))}
          </dd>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="flex gap-2">
          <dt className="w-24 shrink-0 pt-0.5 text-muted-foreground">Tags</dt>
          <dd className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}
