"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for app/products/page.tsx (and its loading/page
 * siblings) — must be a Client Component per Next's error.js convention.
 * In production, Server Component errors already arrive here as a
 * generic message + `digest` (Next strips the real message to avoid
 * leaking internal details to visitors) — `console.error` below is for
 * matching that `digest` against server logs, not for surfacing internals
 * in the UI.
 */
export default function ProductsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section heading="Products">
      <div className="flex flex-col items-start gap-4">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="size-4" />
          We couldn&apos;t load products right now.
        </p>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </Section>
  );
}
