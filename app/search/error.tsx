"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

/**
 * Error boundary for app/search/page.tsx — identical shape to
 * app/products/error.tsx (must be a Client Component per Next's error.js
 * convention; `console.error` only correlates the production `digest`
 * with server logs, not for surfacing internals in the UI).
 */
export default function SearchError({
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
    <Section heading="Search">
      <div className="flex flex-col items-start gap-4">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="size-4" />
          We couldn&apos;t load search results right now.
        </p>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </Section>
  );
}
