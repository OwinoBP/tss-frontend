"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

/** Error boundary for app/cart/page.tsx — same shape as app/products/error.tsx. */
export default function CartError({
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
    <Section heading="Cart">
      <div className="flex flex-col items-start gap-4">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="size-4" />
          We couldn&apos;t load your cart right now.
        </p>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </Section>
  );
}
