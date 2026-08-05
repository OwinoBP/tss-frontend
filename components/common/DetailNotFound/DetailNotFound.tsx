import Link from "next/link";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

export interface DetailNotFoundProps {
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
}

/**
 * The canonical Detail page "requested resource could not be found" UI —
 * rendered as a plain inline conditional by the page itself, deliberately
 * NOT via `notFound()`/`not-found.tsx`. See docs/decisions.md, "Detail
 * Page Pattern Hardening" for the confirmed Next.js defect this avoids.
 *
 * Fully generic and presentation-only: no knowledge of `MusicProduct`,
 * `Category`, a slug, a resource type, GraphQL, or services — every
 * Detail page supplies its own copy and recovery link as props. Pair with
 * `DETAIL_NOT_FOUND_METADATA` (`detail-not-found-metadata.ts`, this same
 * folder) in `generateMetadata`'s matching branch.
 */
export function DetailNotFound({
  title,
  message,
  actionLabel,
  actionHref,
}: DetailNotFoundProps) {
  return (
    <Section heading={title}>
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button asChild variant="outline">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </div>
    </Section>
  );
}
