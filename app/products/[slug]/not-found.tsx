import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/config";

/**
 * Rendered when `getProduct` returns `null` and the page calls
 * `notFound()` — a normal application state (a bad/old slug), not an
 * error. Next automatically injects `<meta name="robots" content="noindex">`
 * and a 404 status for this response; nothing extra needed here for that.
 */
export default function ProductNotFound() {
  return (
    <Section heading="Product not found">
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find a product at this address — it may have
          been removed or the link may be out of date.
        </p>
        <Button asChild variant="outline">
          <Link href={routes.products.index}>Browse all products</Link>
        </Button>
      </div>
    </Section>
  );
}
