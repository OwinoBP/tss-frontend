"use client";

import { useEffect } from "react";
import { CircleAlert } from "lucide-react";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";

/** Error boundary for app/checkout/page.tsx — same shape as app/cart/error.tsx. */
export default function CheckoutError({
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
    <Section heading="Checkout">
      <div className="flex flex-col items-start gap-4">
        <p className="flex items-center gap-2 text-sm text-destructive">
          <CircleAlert aria-hidden="true" className="size-4" />
          We couldn&apos;t load checkout right now.
        </p>
        <Button variant="outline" onClick={() => unstable_retry()}>
          Try again
        </Button>
      </div>
    </Section>
  );
}
